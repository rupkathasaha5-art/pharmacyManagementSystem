import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Cart } from "../models/Cart.model.js";
import BatchInventory from "../models/BatchInventory.model.js";
import mongoose from "mongoose";

// @desc    Get the logged-in user's cart from MongoDB with live stock validation
// @route   GET /api/v1/users/cart
export const getCart = asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
        cart = await Cart.create({ user: req.user._id, items: [] });
        return res.status(200).json(new ApiResponse(200, cart, "Cart fetched successfully"));
    }

    // Cross-check every item in the database cart with live BatchInventory stock
    const validatedItems = await Promise.all(cart.items.map(async (item) => {
        const query = item.batchRef ? { _id: item.batchRef } : { batchNumber: item.batchNumber };
        const liveBatch = await BatchInventory.findOne(query);
        
        const currentStock = liveBatch ? liveBatch.quantityInStock : 0;
        
        let warning = null;
        let hasIssue = false;

        if (currentStock === 0) {
            warning = "Out of stock! Please remove from cart.";
            hasIssue = true;
        } else if (item.orderQuantity > currentStock) {
            warning = `Only ${currentStock} units left in stock! Please reduce quantity.`;
            hasIssue = true;
        }

        const itemObj = item.toObject ? item.toObject() : item;

        return {
            ...itemObj,
            totalStock: currentStock,
            warning,
            hasIssue
        };
    }));

    const cartData = {
        ...cart.toObject(),
        items: validatedItems
    };
    
    return res.status(200).json(new ApiResponse(200, cartData, "Cart fetched successfully"));
});

export const syncCart = asyncHandler(async (req, res) => {
    console.log("req.user in syncCart:", req.user);
    const { items } = req.body;
    
    const rawItems = Array.isArray(items) ? items : [];

    // Sanitize incoming items so Mongoose schema validation never fails on unmapped references
    const incomingItems = rawItems.map(item => ({
        _id: String(item._id || item.batchNumber),
        product: item.product || item.name || "Unknown Product",
        batchNumber: item.batchNumber || String(item._id),
        manufacturer: item.manufacturer || "",
        packSize: item.packSize || "",
        salesRate: Number(item.salesRate) || 0,
        mrp: Number(item.mrp) || 0,
        orderQuantity: Number(item.orderQuantity) || 1,
        totalStock: Number(item.totalStock) || 0,
        // Only attach valid ObjectIds if they exist, otherwise omit
        ...(mongoose.Types.ObjectId.isValid(item.productRef) && { productRef: item.productRef }),
        ...(mongoose.Types.ObjectId.isValid(item.batchRef) && { batchRef: item.batchRef })
    }));

    console.log("💾 [SYNC] About to call findOneAndUpdate. Item count:", incomingItems.length);

    // Find user's cart and update items array securely
    const cart = await Cart.findOneAndUpdate(
        { user: req.user._id },
        { $set: { items: incomingItems } },
        { upsert: true, runValidators: true, returnDocument: 'after' }
    );

    console.log("💾 [SYNC] findOneAndUpdate RESOLVED:", cart?._id, "items now:", cart?.items?.length);

    return res.status(200).json(new ApiResponse(200, cart, "Cart synced securely to database"));
});