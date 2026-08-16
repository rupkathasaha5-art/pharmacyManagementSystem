import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Cart } from "../models/Cart.model.js";
import BatchInventory from "../models/BatchInventory.model.js";
import Order from "../models/Order.model.js";
import { Org } from "../models/Org.model.js";
import mongoose from "mongoose";

// @desc    Checkout cart and create B2B order with schema-aligned credit checks, tax splitting & atomic stock deduction
// @route   POST /api/v1/orders/checkout
export const createOrder = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;

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

    // 2. Verify Legal KYC Status
    if (buyerOrg.status !== 'approved') {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json(
        new ApiResponse(403, null, `Checkout blocked: Organization KYC status is '${buyerOrg.status}'. Remarks: ${buyerOrg.statusRemarks || 'Must be approved to trade.'}`)
      );
    }

    // 3. Verify Drug License Expiry
    if (buyerOrg.organization?.license?.expiryDate && new Date(buyerOrg.organization.license.expiryDate) < new Date()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json(new ApiResponse(403, null, "Checkout blocked: Organization drug license has expired. Please update legal documentation."));
    }

    // 4. Verify Trade Credit Status
    if (buyerOrg.creditProfile?.isCreditFrozen) {
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

    let orderTotal = 0;
    const processedOrderItems = [];

    // 6. Validate live stock, deduct inventory, and compute item taxes
    for (const cartItem of cart.items) {
      const batchQuery = cartItem.batchRef ? { _id: cartItem.batchRef } : { batchNumber: cartItem.batchNumber };
      const batch = await BatchInventory.findOne(batchQuery).populate('product').session(session);

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

      // Deduct stock
      batch.quantityInStock -= orderQty;
      await batch.save({ session });

      // Line item calculations
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

    // 7. Credit Limit Verification
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

    // 8. Explicit Atomic Update of the Org Document in DB
    const updatedOrg = await Org.findByIdAndUpdate(
      buyerOrg._id,
      {
        $set: {
          "creditProfile.currentOutstanding": projectedOutstanding
        }
      },
      { session, new: true, runValidators: true }
    );

    // 9. Generate Invoicing and Due Date
    const creditDays = buyerOrg.creditProfile?.creditDays || 14;
    const now = new Date();
    const dueDate = new Date(now.getTime() + creditDays * 24 * 60 * 60 * 1000);
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // 10. Create Order Document
    const newOrder = await Order.create([{
      buyerOrg: buyerOrg._id,
      items: processedOrderItems,
      orderTotal: orderTotal,
      status: 'placed',
      invoiceNumber: invoiceNumber,
      invoiceDate: now,
      dueDate: dueDate
    }], { session });

    // 11. Clear Cart
    cart.items = [];
    await cart.save({ session });

    // Commit Transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(
      new ApiResponse(201, {
        order: newOrder[0],
        updatedOrg: updatedOrg
      }, `Order ${invoiceNumber} placed successfully on Net-${creditDays} terms.`)
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