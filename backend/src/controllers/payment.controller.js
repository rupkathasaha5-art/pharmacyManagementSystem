import Stripe from "stripe";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Payment } from "../models/Payment.model.js";
import Order from "../models/Order.model.js";
import { Org } from "../models/Org.model.js";
import { Cart } from "../models/Cart.model.js";
import { generateDeliveryOtp } from "./order.controller.js";
import  {reconcileOrgCreditStatus}  from "../jobs/creditFreezeCron.js"; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Initiates Stripe Payment Intent securely by fetching the Order value from DB
 * Route: POST /api/v1/payments/create-intent
 */
export const createPaymentIntent = asyncHandler(async (req, res) => {
  try {
    console.log("1. Starting intent creation. Request body:", req.body);
    const { orderId } = req.body;
    const orgId = req.user?.org;

    if (!orderId) {
      return res.status(400).json(new ApiResponse(400, null, "Order ID is required"));
    }

    console.log(`2. Searching DB for Order ID: ${orderId}`);
    const order = await Order.findById(orderId);

    if (!order) {
      console.log("❌ Order not found in DB!");
      return res.status(404).json(new ApiResponse(404, null, "Order not found"));
    }

    // Make sure the requesting user's org actually owns this order —
    // otherwise anyone with a valid session could create a payment intent
    // (and a Payment record) against someone else's order.
    if (orgId && order.buyerOrg?.toString() !== orgId.toString()) {
      console.log("❌ Order does not belong to requesting org!");
      return res.status(403).json(new ApiResponse(403, null, "This order does not belong to your organization."));
    }

    console.log(`3. Order found! Total: ₹${order.orderTotal}. Contacting Stripe...`);
    const amountInSmallestUnit = Math.round(order.orderTotal * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: "inr",
      automatic_payment_methods: { enabled: true },
      metadata: {
        orgId: orgId ? orgId.toString() : "",
        orderId: orderId.toString()
      },
    });

    console.log("4. Stripe Success! Recording payment ledger...");
    const paymentRecord = await Payment.create({
      org: orgId,
      initiatedBy: req.user?._id,
      orders: [orderId],
      amount: order.orderTotal,
      currency: "INR",
      gateway: "stripe",
      paymentMethodType: "card",
      gatewayTransactionId: paymentIntent.id,
      status: "initiated",
    });

    console.log("5. Sending Success Response to React!");
    return res.status(200).json(
      new ApiResponse(200, {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        paymentRecordId: paymentRecord._id,
        orderSummary: { total: order.orderTotal }
      }, "Payment intent created successfully")
    );

  } catch (error) {
    // THIS WILL CATCH THE SILENT CRASH
    console.error("🚨 FATAL ERROR IN PAYMENT CONTROLLER:", error.message);
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

/**
 * Synchronous Verification (Replaces Webhooks)
 * Route: POST /api/v1/payments/verify
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId, orderId } = req.body;

  if (!paymentIntentId || !orderId) {
    throw new ApiError(400, "Payment Intent ID and Order ID are required");
  }

  // 1. Ask Stripe directly for the source of truth
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  // 2. Confirm this payment intent actually belongs to the orderId the
  // client is claiming, and to the requesting user's org. Without this,
  // a valid orderId/paymentIntentId pair belonging to someone else could
  // be replayed here to mark a different org's order as paid, or clear
  // the wrong user's cart.
  if (paymentIntent.metadata?.orderId !== orderId) {
    throw new ApiError(400, "This payment intent does not match the given order.");
  }
  const requestingOrgId = req.user?.org;
  if (requestingOrgId && paymentIntent.metadata?.orgId !== requestingOrgId.toString()) {
    throw new ApiError(403, "This payment does not belong to your organization.");
  }

  // 3. Handle Failed Payments
  if (paymentIntent.status !== "succeeded") {
    await Payment.findOneAndUpdate(
      { gatewayTransactionId: paymentIntentId },
      {
        status: "failed",
        failureReason: paymentIntent.last_payment_error?.message || "Verification failed"
      },
      { runValidators: true }
    );
    throw new ApiError(400, `Payment verification failed. Status: ${paymentIntent.status}`);
  }

  // 4. Handle Successful Payments
  const payment = await Payment.findOneAndUpdate(
    { gatewayTransactionId: paymentIntentId },
    {
      status: "succeeded",
      amount: paymentIntent.amount_received / 100,
      currency: paymentIntent.currency.toUpperCase(),
      rawGatewayResponse: paymentIntent,
      paidAt: new Date()
    },
    { new: true, runValidators: true }
  );

  // 5. Look up the org for creditDays context (used only for consistency
  // with the net-terms invoice shape — immediate orders don't have a due date)
  const buyerOrg = requestingOrgId ? await Org.findById(requestingOrgId) : null;

  // 6. Update Order fulfillment status AND generate the invoice number now,
  // since payment is genuinely confirmed at this point. This is deliberately
  // NOT done at checkout time for immediate-payment orders — an abandoned
  // or failed Stripe payment must never consume a real invoice number.
  const now = new Date();
 const updatedOrder = await Order.findByIdAndUpdate(orderId, {
  status: "placed",
  invoiceNumber: `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
  invoiceDate: now,
  deliveryOtp: generateDeliveryOtp()
}, { new: true, runValidators: true });
  // 7. Clear the buyer's cart now that payment is actually confirmed —
  // moved here from createOrder so a failed/abandoned Stripe payment
  // doesn't wipe items the user hasn't successfully paid for
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $set: { items: [] } }
  );

  return res.status(200).json(
    new ApiResponse(200, { verified: true, order: updatedOrder }, "Payment verified and order updated successfully")
  );
});


// POST /api/v1/payments/settlement/create-intent
// Creates a Stripe intent for the ORG's outstanding credit balance, not tied to an order
export const createSettlementIntent = asyncHandler(async (req, res) => {
  try {
    const orgId = req.user?.org || req.user?.organization;
    if (!orgId) {
      return res.status(400).json(new ApiResponse(400, null, "No organization found for this user."));
    }

    const org = await Org.findById(orgId);
    if (!org) {
      return res.status(404).json(new ApiResponse(404, null, "Organization not found."));
    }

    const outstanding = org.creditProfile?.currentOutstanding ?? 0;
    if (outstanding <= 0) {
      return res.status(400).json(new ApiResponse(400, null, "No outstanding balance to settle."));
    }

    const amountInSmallestUnit = Math.round(outstanding * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: "inr",
      automatic_payment_methods: { enabled: true },
      metadata: {
        orgId: orgId.toString(),
        type: "credit_settlement"
      },
    });

    const paymentRecord = await Payment.create({
      org: orgId,
      initiatedBy: req.user?._id,
      orders: [],
      amount: outstanding,
      currency: "INR",
      gateway: "stripe",
      paymentMethodType: "card",
      type: "credit_settlement",
      gatewayTransactionId: paymentIntent.id,
      status: "initiated",
    });

    return res.status(200).json(
      new ApiResponse(200, {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amountDue: outstanding
      }, "Settlement payment intent created.")
    );
  } catch (error) {
    console.error("🚨 SETTLEMENT INTENT ERROR:", error.message);
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});



export const verifySettlement = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;
  if (!paymentIntentId) throw new ApiError(400, "Payment Intent ID is required.");

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  const requestingOrgId = req.user?.org || req.user?.organization;
  if (paymentIntent.metadata?.type !== "credit_settlement" ||
      paymentIntent.metadata?.orgId !== requestingOrgId?.toString()) {
    throw new ApiError(403, "This payment does not belong to your organization.");
  }

  if (paymentIntent.status !== "succeeded") {
    await Payment.findOneAndUpdate(
      { gatewayTransactionId: paymentIntentId },
      { status: "failed", failureReason: paymentIntent.last_payment_error?.message || "Verification failed" },
      { runValidators: true }
    );
    throw new ApiError(400, `Settlement verification failed. Status: ${paymentIntent.status}`);
  }

  const paidTotal = paymentIntent.amount_received / 100;
  let remainingToAllocate = paidTotal;

  await Payment.findOneAndUpdate(
    { gatewayTransactionId: paymentIntentId },
    {
      status: "succeeded",
      amount: paidTotal,
      currency: paymentIntent.currency.toUpperCase(),
      rawGatewayResponse: paymentIntent,
      paidAt: new Date()
    },
    { new: true, runValidators: true }
  );

  // Allocate the payment across unsettled net_14 orders, oldest dueDate first.
  // This is what makes the AR dashboard's "days overdue" and the freeze/unfreeze
  // cron accurate per invoice, instead of relying on one org-level aggregate.
  const unsettledOrders = await Order.find({
    buyerOrg: requestingOrgId,
    paymentMethod: 'net_14',
    creditSettled: false,
    status: { $ne: 'cancelled' }
  }).sort({ dueDate: 1 });

  const settledOrderIds = [];

  for (const order of unsettledOrders) {
    if (remainingToAllocate <= 0) break;

    const remainingOnOrder = Number((order.orderTotal - order.amountSettled).toFixed(2));
    if (remainingOnOrder <= 0) continue;

    const applied = Math.min(remainingOnOrder, remainingToAllocate);
    order.amountSettled = Number((order.amountSettled + applied).toFixed(2));
    remainingToAllocate = Number((remainingToAllocate - applied).toFixed(2));

    if (order.amountSettled >= order.orderTotal) {
      order.creditSettled = true;
      order.creditSettledAt = new Date();
      settledOrderIds.push(order._id);
    }

    await order.save();
  }

  // Org-level currentOutstanding remains the source of truth for "amount owed
  // right now" — the per-order allocation above is what makes days-overdue and
  // freeze checks accurate per invoice, not a replacement for this field.
  const org = await Org.findById(requestingOrgId);
  const newOutstanding = Math.max(
    0,
    Number(((org.creditProfile?.currentOutstanding ?? 0) - paidTotal).toFixed(2))
  );

  const updatedOrg = await Org.findByIdAndUpdate(
    requestingOrgId,
    { $set: { "creditProfile.currentOutstanding": newOutstanding } },
    { new: true, runValidators: true }
  );

  // Reconcile freeze status immediately, rather than waiting for tonight's cron
  const creditStatus = await reconcileOrgCreditStatus(requestingOrgId);

  return res.status(200).json(
    new ApiResponse(200, {
      verified: true,
      org: updatedOrg,
      settledOrders: settledOrderIds,
      creditStatus
    }, "Outstanding balance settled.")
  );
});