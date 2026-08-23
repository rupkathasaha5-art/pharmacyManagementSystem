import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Cart } from "../models/Cart.model.js";
import BatchInventory from "../models/BatchInventory.model.js";
import Order from "../models/Order.model.js";
import { Org } from "../models/Org.model.js";
import mongoose from "mongoose";


// Generates a 6-digit delivery confirmation code, printed on the invoice
// and later matched against what the driver enters via confirm-delivery
export const generateDeliveryOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

//Checkout cart and create B2B order with schema-aligned credit checks, tax splitting & atomic stock deduction
//POST /api/v1/orders/checkout
export const createOrder = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { paymentMethod } = req.body; // 'net_14' | 'immediate'

    if (!paymentMethod || !['net_14', 'immediate'].includes(paymentMethod)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(new ApiResponse(400, null, "A valid paymentMethod ('net_14' or 'immediate') is required."));
    }

    const isCreditOrder = paymentMethod === 'net_14';

    // 1. Fetch user's organization profile matching the Org schema
    const orgId = req.user.org || req.user.organization || req.body.orgId;
    const buyerOrg = orgId
      ? await Org.findById(orgId).session(session)
      : await Org.findOne({ "organization.email": req.user.email }).session(session);

    if (!buyerOrg) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(new ApiResponse(400, null, "Organization profile not found for the user."));
    }

    // 2. Verify Legal KYC Status (applies to both payment methods — you still need a valid, approved org to trade)
    if (buyerOrg.status !== 'approved') {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json(
        new ApiResponse(403, null, `Checkout blocked: Organization KYC status is '${buyerOrg.status}'. Remarks: ${buyerOrg.statusRemarks || 'Must be approved to trade.'}`)
      );
    }

    // 3. Verify Drug License Expiry (applies to both — this is a trading-eligibility check, not a credit check)
    if (buyerOrg.organization?.license?.expiryDate && new Date(buyerOrg.organization.license.expiryDate) < new Date()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json(new ApiResponse(403, null, "Checkout blocked: Organization drug license has expired. Please update legal documentation."));
    }

    // 4. Verify Trade Credit Status — ONLY relevant if paying on credit terms
    if (isCreditOrder && buyerOrg.creditProfile?.isCreditFrozen) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(
        new ApiResponse(400, null, `Trade credit frozen: ${buyerOrg.creditProfile.freezeReason || 'Outstanding balance overdue past payment terms.'}`)
      );
    }

    // State comparison for GST calculation (Intrastate vs Interstate)
    const sellerState = "Jharkhand";
    const buyerState = buyerOrg.organization?.address?.state || "Jharkhand";
    const isIntrastate = sellerState.trim().toLowerCase() === buyerState.trim().toLowerCase();

    // 5. Fetch user active cart
    const cart = await Cart.findOne({ user: userId }).session(session);
    if (!cart || !cart.items || cart.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(new ApiResponse(400, null, "Your cart is empty."));
    }

    // 6. Batch-fetch all inventory in ONE query instead of N sequential findOne calls
    const batchIds = cart.items.filter(i => i.batchRef).map(i => i.batchRef);
    const batchNumbers = cart.items.filter(i => !i.batchRef).map(i => i.batchNumber);

    const batches = await BatchInventory.find({
      $or: [
        ...(batchIds.length ? [{ _id: { $in: batchIds } }] : []),
        ...(batchNumbers.length ? [{ batchNumber: { $in: batchNumbers } }] : [])
      ]
    }).populate('product').session(session);

    // Index by both possible lookup keys for O(1) access in the loop below
    const batchById = new Map(batches.map(b => [b._id.toString(), b]));
    const batchByNumber = new Map(batches.map(b => [b.batchNumber, b]));

    let orderTotal = 0;
    const processedOrderItems = [];
    const stockBulkOps = [];

    // 7. Validate stock & compute line totals in memory (no DB calls inside this loop)
    for (const cartItem of cart.items) {
      const batch = cartItem.batchRef
        ? batchById.get(cartItem.batchRef.toString())
        : batchByNumber.get(cartItem.batchNumber);

      if (!batch) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json(new ApiResponse(404, null, `Batch not found for product: ${cartItem.product}`));
      }

      const orderQty = Number(cartItem.orderQuantity);

      if (batch.quantityInStock < orderQty) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json(
          new ApiResponse(400, null, `Insufficient stock for ${batch.product?.name || cartItem.product}. Only ${batch.quantityInStock} units left.`)
        );
      }

      // Track the in-memory deduction so a second cart item referencing
      // the same batch doesn't oversell against stale stock numbers
      batch.quantityInStock -= orderQty;

      stockBulkOps.push({
        updateOne: {
          filter: { _id: batch._id },
          update: { $inc: { quantityInStock: -orderQty } }
        }
      });

      const rate = Number(cartItem.salesRate);
      const baseLineTotal = orderQty * rate;
      const gstPercentage = Number(batch.product?.gstPercentage || 12);
      const totalTaxAmount = Number((baseLineTotal * (gstPercentage / 100)).toFixed(2));

      let cgst = 0, sgst = 0, igst = 0;
      if (isIntrastate) {
        cgst = Number((totalTaxAmount / 2).toFixed(2));
        sgst = Number((totalTaxAmount / 2).toFixed(2));
      } else {
        igst = totalTaxAmount;
      }

      const lineTotal = Number((baseLineTotal + totalTaxAmount).toFixed(2));
      orderTotal += lineTotal;

      processedOrderItems.push({
        product: batch.product?._id || cartItem.productRef,
        batch: batch._id,
        productName: batch.product?.name || cartItem.product,
        hsn: batch.product?.hsnCode || cartItem.hsn || "3004",
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        quantity: orderQty,
        rate: rate,
        gst: { cgst, sgst, igst },
        lineTotal: lineTotal
      });
    }

    orderTotal = Number(orderTotal.toFixed(2));

    // 8. One bulkWrite for all stock deductions instead of N sequential .save() calls
    if (stockBulkOps.length > 0) {
      await BatchInventory.bulkWrite(stockBulkOps, { session });
    }

    // 9. Credit Limit Verification — ONLY for net-terms orders
    let updatedOrg = buyerOrg;
    if (isCreditOrder) {
      const creditLimit = buyerOrg.creditProfile?.creditLimit ?? 50000;
      const currentOutstanding = buyerOrg.creditProfile?.currentOutstanding ?? 0;
      const projectedOutstanding = Number((currentOutstanding + orderTotal).toFixed(2));

      if (projectedOutstanding > creditLimit) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json(
          new ApiResponse(400, {
            creditLimit,
            currentOutstanding,
            attemptedOrderTotal: orderTotal,
            exceededBy: Number((projectedOutstanding - creditLimit).toFixed(2))
          }, `Credit limit exceeded! Outstanding debt (₹${currentOutstanding}) + Order total (₹${orderTotal}) exceeds approved limit of ₹${creditLimit}.`)
        );
      }

      // Only touch the credit ledger when the order is actually being placed on credit
      updatedOrg = await Org.findByIdAndUpdate(
        buyerOrg._id,
        { $set: { "creditProfile.currentOutstanding": projectedOutstanding } },
        { session, new: true, runValidators: true }
      );
    }

    // 10. Invoicing / due date — ONLY generated for credit orders at this stage.
    // Immediate-payment orders don't get an invoiceNumber or deliveryOtp yet:
    // both are assigned later in verifyPayment once Stripe actually confirms
    // payment, so an abandoned/failed checkout never consumes a real invoice
    // number or prints an OTP for an order that was never paid.
    const creditDays = buyerOrg.creditProfile?.creditDays || 14;
    const now = new Date();
    const invoiceFields = isCreditOrder
      ? {
          invoiceNumber: `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          invoiceDate: now,
          dueDate: new Date(now.getTime() + creditDays * 24 * 60 * 60 * 1000),
          deliveryOtp: generateDeliveryOtp()
        }
      : {};
    // 11. Create Order Document
    const newOrder = await Order.create([{
      buyerOrg: buyerOrg._id,
      items: processedOrderItems,
      orderTotal: orderTotal,
      paymentMethod: paymentMethod,
      status: isCreditOrder ? 'placed' : 'pending_payment',
      ...invoiceFields
    }], { session });

    // 12. Clear Cart — only for credit orders, which are finalized immediately.
    // Immediate-payment orders keep their cart until payment is verified.
    if (isCreditOrder) {
      cart.items = [];
      await cart.save({ session });
    }

    // Commit Transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(
      new ApiResponse(201, {
        order: newOrder[0],
        updatedOrg: isCreditOrder ? updatedOrg : undefined
      }, isCreditOrder
        ? `Order ${invoiceFields.invoiceNumber} placed successfully on Net-${creditDays} terms.`
        : `Order created. Proceed to payment to complete your purchase.`
      )
    );

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ [CHECKOUT ERROR]:", error);
    return res.status(500).json(
      new ApiResponse(500, null, error.message || "Failed to process checkout transaction.")
    );
  }
});



// POST /api/v1/orders/:id/cancel
export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  // Ownership check — an ORG_ADMIN can only cancel orders belonging to
  // their own org, not any org's order in the system
 if (req.user.role === 'ORG_ADMIN') {
  const requestingOrgId = req.user.org || req.user.organization;
  if (requestingOrgId && order.buyerOrg?.toString() !== requestingOrgId.toString()) {
    throw new ApiError(403, "You do not have permission to cancel this order.");
  }
}
  if (['delivered', 'cancelled'].includes(order.status)) {
    throw new ApiError(400, `Cannot cancel an order that is already '${order.status}'.`);
  }

  // Restore stock, since it was deducted at checkout regardless of payment method
  const stockRestoreOps = order.items.map(item => ({
    updateOne: {
      filter: { _id: item.batch },
      update: { $inc: { quantityInStock: item.quantity } }
    }
  }));
  if (stockRestoreOps.length > 0) {
    await BatchInventory.bulkWrite(stockRestoreOps);
  }

  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.cancelledBy = req.user._id;
  order.cancellationReason = reason || 'Cancelled by admin';
  await order.save();

  return res.status(200).json(new ApiResponse(200, order, "Order cancelled and stock restored."));
});



// POST /api/v1/orders/:id/dispatch
// Marks an order as picked up by a driver — internal/logistics action,
// not restricted by buyerOrg since staff dispatch orders across all buyers
export const dispatchOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { driverId } = req.body;

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  if (order.status !== 'placed') {
    throw new ApiError(400, `Cannot dispatch an order with status '${order.status}'. Only 'placed' orders can be dispatched.`);
  }

  order.status = 'out_for_delivery';
  order.assignedDriver = driverId || undefined;
  order.outForDeliveryAt = new Date();
  await order.save();

  return res.status(200).json(new ApiResponse(200, order, "Order marked out for delivery."));
});

// POST /api/v1/orders/:id/confirm-delivery
// Driver submits the OTP (printed on the invoice) that the buyer gave them
export const confirmDelivery = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { otp } = req.body;

  if (!otp) throw new ApiError(400, "Delivery OTP is required.");

  const order = await Order.findById(id).select('+deliveryOtp');
  if (!order) throw new ApiError(404, "Order not found");

  if (order.status !== 'out_for_delivery') {
    throw new ApiError(400, `Cannot confirm delivery for an order with status '${order.status}'.`);
  }

  // Only the driver this order was assigned to can confirm its delivery
  if (order.assignedDriver && order.assignedDriver.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "This order is not assigned to you.");
  }

  if (order.deliveryOtp !== otp) {
    throw new ApiError(400, "Invalid delivery OTP.");
  }

  order.status = 'delivered';
  order.deliveredAt = new Date();
  await order.save();

  return res.status(200).json(new ApiResponse(200, order, "Delivery confirmed."));
});



// GET /api/v1/orders/admin/status-summary
// Gives a quick count of orders per status — useful for a dashboard
// widget showing "12 placed, 4 out for delivery, 2 delivered today" etc.
export const getOrderStatusSummary = asyncHandler(async (req, res) => {
  const summary = await Order.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  return res.status(200).json(new ApiResponse(200, summary, "Order status summary fetched."));
});

// GET /api/v1/orders/admin?status=out_for_delivery
// Fetches orders, optionally filtered by status, for the admin order list view
export const getOrdersByStatus = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = status ? { status } : {};

  const orders = await Order.find(filter)
    .populate('buyerOrg', 'organization.name creditProfile.isCreditFrozen status')
    .populate('assignedDriver', 'name email')
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, orders, "Orders fetched."));
});










//=====================================================================================================
// GET /api/v1/orders/admin/receivables
// Orgs with an outstanding trade-credit balance, sorted most-overdue first.
// "Days overdue" is anchored to the oldest unsettled net_14 order's dueDate
// per org — accurate now that verifySettlement marks individual orders
// creditSettled: true as they're paid off (oldest-first), instead of only
// decrementing one aggregate number on the Org document.
export const getAccountsReceivable = asyncHandler(async (req, res) => {
  const orgs = await Org.find({ "creditProfile.currentOutstanding": { $gt: 0 } })
    .select('organization.name organization.taxId organization.phone organization.email creditProfile status')
    .lean();

  if (orgs.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No outstanding receivables."));
  }

  const orgIds = orgs.map(o => o._id);

  const oldestOrders = await Order.aggregate([
    {
      $match: {
        buyerOrg: { $in: orgIds },
        paymentMethod: 'net_14',
        creditSettled: false,
        status: { $ne: 'cancelled' }
      }
    },
    { $sort: { dueDate: 1 } },
    {
      $group: {
        _id: "$buyerOrg",
        oldestDueDate: { $first: "$dueDate" },
        oldestInvoiceNumber: { $first: "$invoiceNumber" },
        unsettledOrderCount: { $sum: 1 }
      }
    }
  ]);

  const oldestByOrg = new Map(oldestOrders.map(o => [o._id.toString(), o]));
  const now = new Date();

  const receivables = orgs.map(org => {
    const oldest = oldestByOrg.get(org._id.toString());
    const dueDate = oldest?.oldestDueDate || null;
    const daysOverdue = dueDate
      ? Math.max(0, Math.floor((now - new Date(dueDate)) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      orgId: org._id,
      orgName: org.organization?.name,
      taxId: org.organization?.taxId,
      phone: org.organization?.phone,
      email: org.organization?.email,
      amountDue: org.creditProfile?.currentOutstanding || 0,
      creditLimit: org.creditProfile?.creditLimit || 0,
      isCreditFrozen: org.creditProfile?.isCreditFrozen || false,
      freezeReason: org.creditProfile?.freezeReason || null,
      oldestDueDate: dueDate,
      oldestInvoiceNumber: oldest?.oldestInvoiceNumber || null,
      unsettledOrderCount: oldest?.unsettledOrderCount || 0,
      daysOverdue
    };
  }).sort((a, b) => b.daysOverdue - a.daysOverdue);

  return res.status(200).json(new ApiResponse(200, receivables, "Accounts receivable fetched."));
});