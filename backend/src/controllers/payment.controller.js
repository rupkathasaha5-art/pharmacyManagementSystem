import Stripe from "stripe";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Payment } from "../models/Payment.model.js";
import Order  from "../models/Order.model.js";
import { Org } from "../models/Org.model.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Initiates Stripe Payment Intent
 * Route: POST /api/v1/payments/create-intent
 */
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderIds, amount, currency = "INR", settleCredit = false } = req.body;
  const orgId = req.user?.org;

  if (!amount || Number(amount) <= 0) {
    throw new ApiError(400, "Valid payment amount is required");
  }

  // Convert decimal to smallest currency unit (e.g. ₹500.00 -> 50000 paise / cents)
  const amountInSmallestUnit = Math.round(Number(amount) * 100);

  // 1. Create Stripe Payment Intent
  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        orgId: orgId ? orgId.toString() : "",
        orderIds: JSON.stringify(orderIds || []),
        settleCredit: String(settleCredit),
      },
    });
  } catch (error) {
    throw new ApiError(500, `Stripe Intent Creation Failed: ${error.message}`);
  }

  // 2. Pre-record transaction in ledger
  const paymentRecord = await Payment.create({
    org: orgId,
    initiatedBy: req.user?._id,
    orders: orderIds || [],
    amount: Number(amount),
    currency: currency.toUpperCase(),
    gateway: "stripe",
    paymentMethodType: "card",
    gatewayTransactionId: paymentIntent.id,
    status: "initiated",
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        paymentRecordId: paymentRecord._id,
      },
      "Payment intent created successfully"
    )
  );
});

/**
 * Handles Webhook Events from Stripe
 * Route: POST /api/v1/payments/webhook
 */


export const handleStripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  // 1. Verification / Dev Bypass
  if (process.env.NODE_ENV === "development" && !process.env.STRIPE_WEBHOOK_SECRET) {
    try {
      event = JSON.parse(req.body.toString());
    } catch (err) {
      throw new ApiError(400, `Webhook JSON parsing failed: ${err.message}`);
    }
  } else {
    if (!sig) {
      throw new ApiError(400, "Missing Stripe-Signature header");
    }

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      throw new ApiError(400, `Webhook Signature Verification Failed: ${err.message}`);
    }
  }

  // 2. Process Events
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const { orderId, orgId } = paymentIntent.metadata || {};

      if (!orderId) {
        throw new ApiError(400, "Metadata missing orderId on PaymentIntent");
      }

      // Update the immutable Payment ledger
      const payment = await Payment.findOneAndUpdate(
        { gatewayTransactionId: paymentIntent.id },
        {
          status: "succeeded",
          amount: paymentIntent.amount_received / 100,
          currency: paymentIntent.currency,
          rawPayload: paymentIntent
        },
        { new: true, upsert: true }
      );

      // Update Order fulfillment status
      await Order.findByIdAndUpdate(orderId, {
        status: "invoiced",
        invoiceDate: new Date()
      });

      // Update Org credit profile / trade balance if tracked
      if (orgId) {
        await Org.findByIdAndUpdate(orgId, {
          $inc: { "creditProfile.currentOutstanding": -(paymentIntent.amount_received / 100) }
        });
      }

      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;

      await Payment.findOneAndUpdate(
        { gatewayTransactionId: paymentIntent.id },
        {
          status: "failed",
          failureReason: paymentIntent.last_payment_error?.message || "Payment failed",
          rawPayload: paymentIntent
        },
        { new: true, upsert: true }
      );
      break;
    }

    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  // 3. Return Standard API Response
  return res
    .status(200)
    .json(new ApiResponse(200, { received: true }, "Webhook processed successfully"));
});