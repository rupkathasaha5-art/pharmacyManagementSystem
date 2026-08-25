import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Product from "../models/Product.model.js";
import BatchInventory from "../models/BatchInventory.model.js";
import mongoose from "mongoose";

const DAYS_90 = 90 * 24 * 60 * 60 * 1000;
const DAYS_365 = 365 * 24 * 60 * 60 * 1000;

// Same classification boundaries as the nightly expiryClassificationCron —
// computed here too so a batch never sits as 'green' (full-price, sellable)
// between the moment it's added and the next midnight cron run.
const getExpiryStatus = (expiryDate) => {
  const now = new Date();
  const in90Days = new Date(now.getTime() + DAYS_90);
  const in1Year = new Date(now.getTime() + DAYS_365);

  const expiry = new Date(expiryDate);
  if (expiry < in90Days) return 'red';
  if (expiry < in1Year) return 'yellow';
  return 'green';
};

export const addInventory = asyncHandler(async (req, res) => {
    const {
        product,
        batchNumber,
        manufacturingDate,
        expiryDate,
        quantityInStock,
        purchaseRate,
        mrp,
        salesRate,
        supplierName,
        purchaseDate,
        taxInclusive
    } = req.body;

    // required-field check, matching the schema's own required fields
    if (!product || !mongoose.Types.ObjectId.isValid(product)) {
        throw new ApiError(400, "A valid product reference is required.");
    }
    if (!batchNumber?.trim()) {
        throw new ApiError(400, "Batch number is required.");
    }
    if (!expiryDate || isNaN(Date.parse(expiryDate))) {
        throw new ApiError(400, "A valid expiry date is required.");
    }
    if (mrp === undefined || mrp === null || Number(mrp) < 0) {
        throw new ApiError(400, "A valid MRP is required.");
    }
    if (purchaseRate === undefined || purchaseRate === null || Number(purchaseRate) < 0) {
        throw new ApiError(400, "A valid purchase rate is required.");
    }
    if (salesRate === undefined || salesRate === null || Number(salesRate) < 0) {
        throw new ApiError(400, "A valid sales rate is required.");
    }
    if (quantityInStock === undefined || quantityInStock === null || Number(quantityInStock) < 0) {
        throw new ApiError(400, "A valid stock quantity is required.");
    }

    // confirm the product this batch is being logged against actually exists
    const existingProduct = await Product.findById(product);
    if (!existingProduct) {
        throw new ApiError(404, "The referenced product could not be found.");
    }

    // expiry shouldn't be in the past stops someone accidentally logging dead stock
    if (new Date(expiryDate) <= new Date()) {
        throw new ApiError(400, "Expiry date must be in the future.");
    }

    // Classify immediately, matching the nightly cron's boundaries. Red-tier
    // stock (expiring within 90 days) is rejected outright at intake rather
    // than accepted and soft-deactivated later — there's no reason to bring
    // near-expired stock into active inventory when the rule is that it has
    // to go back to the manufacturer anyway.
    const expiryStatus = getExpiryStatus(expiryDate);
    if (expiryStatus === 'red') {
        throw new ApiError(
            400,
            `This batch expires within 90 days (${new Date(expiryDate).toLocaleDateString()}) and cannot be added to active inventory. Stock this close to expiry should be returned to the manufacturer instead.`
        );
    }

    let newBatch;
    try {
        newBatch = await BatchInventory.create({
            product,
            batchNumber: batchNumber.trim(),
            manufacturingDate: manufacturingDate || undefined,
            expiryDate,
            quantityInStock: Number(quantityInStock),
            purchaseRate: Number(purchaseRate),
            mrp: Number(mrp),
            salesRate: Number(salesRate),
            supplierName: supplierName?.trim(),
            purchaseDate: purchaseDate || undefined,
            taxInclusive: Boolean(taxInclusive),
            expiryStatus
        });
    } catch (dbError) {
        // the unique index on {product, batchNumber} catches duplicate batch entries
        if (dbError.code === 11000) {
            throw new ApiError(409, `Batch "${batchNumber}" already exists for this product.`);
        }
        throw dbError;
    }

    return res.status(201).json(
        new ApiResponse(201, newBatch, `Batch ${newBatch.batchNumber} added to inventory successfully.`)
    );
});