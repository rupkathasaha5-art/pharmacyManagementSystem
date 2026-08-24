import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Cart } from "../models/Cart.model.js";
import BatchInventory from "../models/BatchInventory.model.js";
import Order from "../models/Order.model.js";
import { Org } from "../models/Org.model.js";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import { User } from "../models/User.model.js";

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

//=============================================driver controllers======================================================

// GET /api/v1/orders/driver/manifest
// Today's assigned, in-progress drop-offs for the logged-in driver
export const getMyManifest = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    assignedDriver: req.user._id,
    status: 'out_for_delivery'
  })
    .populate('buyerOrg', 'organization.name organization.phone organization.email organization.address')
    .sort({ outForDeliveryAt: 1 });

  return res.status(200).json(new ApiResponse(200, orders, "Manifest fetched."));
});

// POST /api/v1/orders/:id/report-exception
// Driver reports a failed drop-off (shop closed, recipient unavailable, etc.)
export const reportDeliveryException = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) throw new ApiError(400, "An exception reason is required.");

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  if (order.status !== 'out_for_delivery') {
    throw new ApiError(400, `Cannot report an exception for an order with status '${order.status}'.`);
  }
  if (order.assignedDriver?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "This order is not assigned to you.");
  }

  order.status = 'delivery_failed';
  order.deliveryException = reason;
  order.deliveryExceptionAt = new Date();
  order.deliveryExceptionReportedBy = req.user._id;
  await order.save();

  return res.status(200).json(new ApiResponse(200, order, "Delivery exception reported."));
});

// GET /api/v1/orders/driver/ledger?status=delivered|delivery_failed
// Driver's own completed/failed deliveries (defaults to both)
export const getMyDeliveryLedger = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = {
    assignedDriver: req.user._id,
    status: status ? status : { $in: ['delivered', 'delivery_failed'] }
  };

  const orders = await Order.find(filter)
    .populate('buyerOrg', 'organization.name')
    .sort({ updatedAt: -1 })
    .limit(200);

  return res.status(200).json(new ApiResponse(200, orders, "Delivery ledger fetched."));
});



//=================================generating invoice pdf==================================================


// GET /api/v1/orders/:id/invoice
// Streams a tax invoice PDF built entirely from the Order's own snapshot data —
// no live BatchInventory/Product lookups, so the invoice always reflects what
// was actually true at the time of sale, even if prices/stock change later.
export const generateInvoicePdf = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .select('+deliveryOtp')
    .populate('buyerOrg', 'organization.name organization.taxId organization.address organization.phone organization.email');

  if (!order) throw new ApiError(404, "Order not found");

  // Ownership check — buyer org can only pull their own invoice; SUPER_ADMIN can pull any
  if (req.user.role === 'ORG_ADMIN') {
    const requestingOrgId = req.user.org || req.user.organization;
    if (requestingOrgId && order.buyerOrg?._id.toString() !== requestingOrgId.toString()) {
      throw new ApiError(403, "You do not have permission to view this invoice.");
    }
  }

  if (!order.invoiceNumber) {
    throw new ApiError(400, "This order does not have an invoice yet — payment may still be pending.");
  }

  const org = order.buyerOrg?.organization || {};
  const address = org.address || {};

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${order.invoiceNumber}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(res);

  const formatCurrency = (n) => `Rs. ${Number(n || 0).toFixed(2)}`;
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '-');

  // --- Header ---
  doc.fontSize(18).font('Helvetica-Bold').text('PharmaStream Wholesale Pvt. Ltd.', { align: 'left' });
  doc.fontSize(9).font('Helvetica').fillColor('#555')
    .text('Registered Office: Jharkhand, India')
    .text('GSTIN: 20AAAAA0000A1Z5'); // replace with your actual seller GSTIN
  doc.moveDown(1.5);

  doc.fillColor('#000').fontSize(16).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
  doc.moveDown(1);

  // --- Invoice meta + Buyer details, side by side ---
  const topY = doc.y;
  doc.fontSize(10).font('Helvetica-Bold').text('Invoice Details', 40, topY);
  doc.font('Helvetica').fontSize(9)
    .text(`Invoice No: ${order.invoiceNumber}`, 40, topY + 15)
    .text(`Invoice Date: ${formatDate(order.invoiceDate)}`, 40, topY + 28)
    .text(`Due Date: ${formatDate(order.dueDate)}`, 40, topY + 41)
    .text(`Payment Terms: ${order.paymentMethod === 'net_14' ? 'Net Trade Credit' : 'Immediate Payment'}`, 40, topY + 54);

  doc.font('Helvetica-Bold').fontSize(10).text('Billed To', 320, topY);
  doc.font('Helvetica').fontSize(9)
    .text(org.name || '-', 320, topY + 15)
    .text(`GSTIN: ${org.taxId || '-'}`, 320, topY + 28)
    .text(`${address.street || ''}, ${address.city || ''}`, 320, topY + 41, { width: 220 })
    .text(`${address.state || ''} - ${address.postalCode || ''}`, 320, topY + 54)
    .text(`Phone: ${org.phone || '-'}`, 320, topY + 67);

  doc.moveDown(4);

  // --- Line items table ---
  const tableTop = doc.y + 10;
  const colX = { sr: 40, name: 65, batch: 190, expiry: 250, hsn: 305, qty: 340, rate: 370, tax: 415, total: 480 };

  doc.font('Helvetica-Bold').fontSize(8);
  doc.text('#', colX.sr, tableTop);
  doc.text('Product', colX.name, tableTop);
  doc.text('Batch', colX.batch, tableTop);
  doc.text('Expiry', colX.expiry, tableTop);
  doc.text('HSN', colX.hsn, tableTop);
  doc.text('Qty', colX.qty, tableTop);
  doc.text('Rate', colX.rate, tableTop);
  doc.text('Tax', colX.tax, tableTop);
  doc.text('Total', colX.total, tableTop, { width: 75, align: 'right' });

  doc.moveTo(40, tableTop + 12).lineTo(555, tableTop + 12).strokeColor('#ccc').stroke();

  let rowY = tableTop + 18;
  doc.font('Helvetica').fontSize(8);

  order.items.forEach((item, idx) => {
    const taxTotal = (item.gst?.cgst || 0) + (item.gst?.sgst || 0) + (item.gst?.igst || 0);

    // Wrap to a new page if we're near the bottom
    if (rowY > 720) {
      doc.addPage();
      rowY = 40;
    }

    doc.text(String(idx + 1), colX.sr, rowY);
    doc.text(item.productName || '-', colX.name, rowY, { width: 120 });
    doc.text(item.batchNumber || '-', colX.batch, rowY, { width: 55 });
    doc.text(formatDate(item.expiryDate), colX.expiry, rowY, { width: 50 });
    doc.text(item.hsn || '-', colX.hsn, rowY, { width: 30 });
    doc.text(String(item.quantity), colX.qty, rowY, { width: 25 });
    doc.text(formatCurrency(item.rate), colX.rate, rowY, { width: 40 });
    doc.text(formatCurrency(taxTotal), colX.tax, rowY, { width: 60 });
    doc.text(formatCurrency(item.lineTotal), colX.total, rowY, { width: 75, align: 'right' });

    rowY += 18;
  });

  doc.moveTo(40, rowY + 4).lineTo(555, rowY + 4).strokeColor('#ccc').stroke();
  rowY += 14;

  // --- Tax breakdown ---
  const totalCgst = order.items.reduce((a, i) => a + (i.gst?.cgst || 0), 0);
  const totalSgst = order.items.reduce((a, i) => a + (i.gst?.sgst || 0), 0);
  const totalIgst = order.items.reduce((a, i) => a + (i.gst?.igst || 0), 0);
  const subtotal = order.items.reduce((a, i) => a + (i.rate * i.quantity), 0);

  doc.font('Helvetica').fontSize(9);
  doc.text('Taxable Value:', 400, rowY, { width: 100, align: 'left' });
  doc.text(formatCurrency(subtotal), 480, rowY, { width: 75, align: 'right' });
  rowY += 14;

  if (totalCgst > 0) {
    doc.text('CGST:', 400, rowY, { width: 100 });
    doc.text(formatCurrency(totalCgst), 480, rowY, { width: 75, align: 'right' });
    rowY += 14;
    doc.text('SGST:', 400, rowY, { width: 100 });
    doc.text(formatCurrency(totalSgst), 480, rowY, { width: 75, align: 'right' });
    rowY += 14;
  }
  if (totalIgst > 0) {
    doc.text('IGST:', 400, rowY, { width: 100 });
    doc.text(formatCurrency(totalIgst), 480, rowY, { width: 75, align: 'right' });
    rowY += 14;
  }

  doc.font('Helvetica-Bold').fontSize(11);
  doc.text('Grand Total:', 400, rowY + 4, { width: 100 });
  doc.text(formatCurrency(order.orderTotal), 480, rowY + 4, { width: 75, align: 'right' });
  rowY += 30;

  // --- Delivery OTP box ---
  if (order.deliveryOtp && order.status !== 'delivered') {
    doc.rect(40, rowY, 515, 45).fillAndStroke('#fff8e1', '#f5c542');
    doc.fillColor('#7a5c00').font('Helvetica-Bold').fontSize(10)
      .text('DELIVERY CONFIRMATION CODE', 55, rowY + 8);
    doc.font('Helvetica-Bold').fontSize(16)
      .text(order.deliveryOtp, 55, rowY + 22);
    doc.font('Helvetica').fontSize(7).fillColor('#7a5c00')
      .text('Provide this code only to the delivery driver, at the moment of receiving your goods.', 200, rowY + 26, { width: 340 });
    rowY += 60;
  }

  doc.fillColor('#000').fontSize(7).text(
    'This is a computer-generated invoice and does not require a physical signature.',
    40, rowY + 20, { align: 'center', width: 515 }
  );

  doc.end();
});



// GET /api/v1/orders/admin/drivers-workload
// Every active driver, with their current count of undelivered assigned
// orders — lets an admin pick the least-loaded driver instead of typing an ID.
export const getDriverWorkloads = asyncHandler(async (req, res) => {
  const drivers = await User.find({ role: 'DRIVER', isActive: true })
    .select('name email phone')
    .lean();

  const workloads = await Order.aggregate([
    { $match: { status: 'out_for_delivery', assignedDriver: { $ne: null } } },
    { $group: { _id: '$assignedDriver', count: { $sum: 1 } } }
  ]);

  const workloadMap = new Map(workloads.map((w) => [w._id.toString(), w.count]));

  const result = drivers
    .map((driver) => ({
      _id: driver._id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      pendingDeliveries: workloadMap.get(driver._id.toString()) || 0,
    }))
    .sort((a, b) => a.pendingDeliveries - b.pendingDeliveries); // least-loaded first — sensible default for who to assign next

  return res.status(200).json(new ApiResponse(200, result, "Driver workloads fetched."));
});