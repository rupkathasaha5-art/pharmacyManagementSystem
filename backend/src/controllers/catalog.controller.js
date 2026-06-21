import Product from '../models/Product.model.js';
import Batch from '../models/Batch.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// --- 1. ADD PRODUCT ---
const addProduct = asyncHandler(async (req, res) => {
    const { 
        product, 
        manufacturer, 
        brand, 
        strength, 
        form, 
        hsn, 
        salesTax, 
        purchaseTax 
    } = req.body;

    const requiredStringFields = ['product', 'hsn'];
    for (const field of requiredStringFields) {
        if (req.body[field] === undefined || req.body[field] === null || String(req.body[field]).trim() === '') {
            throw new ApiError(400, `${field} is required!!`);
        }
    }

    const requiredNumberFields = ['salesTax', 'purchaseTax'];
    for (const field of requiredNumberFields) {
        if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
            throw new ApiError(400, `${field} is required!!`);
        }
    }

    const existingProduct = await Product.findOne({ product, brand });
    if (existingProduct) {
        throw new ApiError(409, 'A product with this name and brand already exists!!');
    }

    const newProduct = await Product.create({
        product, 
        manufacturer, 
        brand, 
        strength, 
        form, 
        hsn, 
        salesTax, 
        purchaseTax
    });

    if (!newProduct) {
        throw new ApiError(500, "Could not register the new product!!"); 
    }

    return res.status(201).json(
        new ApiResponse(201, newProduct, "Registered new product successfully!!")
    );
});


// --- 2. REMOVE BATCH (FIXED) ---
const removeBatch = asyncHandler(async (req, res) => {
    // Assuming the batch ID is passed in the URL, e.g., /api/batches/:batchId
    const { batchId } = req.params;

    if (!batchId) {
        throw new ApiError(400, "Batch ID is required to remove a batch");
    }

    const deletedBatch = await Batch.findByIdAndDelete(batchId);

    if (!deletedBatch) {
        throw new ApiError(404, "Batch not found in the catalog");
    }

    return res.status(200).json(
        new ApiResponse(200, deletedBatch, "Batch successfully removed from the catalog")
    );
});


// --- 3. GET ALL CATALOG BATCHES (FIXED) ---
// Wrapped in asyncHandler to match the rest of your architecture
const getAllCatalogBatches = asyncHandler(async (req, res) => {
    const today = new Date();

    const catalogItems = await Product.aggregate([
        {
            // 1. Relate Product to its Batches
            $lookup: {
                from: 'batches', // CRITICAL: Mongoose automatically pluralizes collection names to lowercase (Batch -> batches)
                localField: '_id',
                foreignField: 'productId',
                as: 'batchDetails'
            }
        },
        {
            // 2. Flatten the array so each batch acts as an individual catalog item card
            $unwind: '$batchDetails'
        },
        {
            // 3. Filter out expired lots or items with zero stock remaining
            $match: {
                'batchDetails.expiryDate': { $gt: today },
                $expr: {
                    $gt: [
                        { $subtract: ['$batchDetails.totalQuantity', '$batchDetails.reservedQuantity'] },
                        0
                    ]
                }
            }
        },
        {
            // 4. Project fields matching your NEW schema
            $project: {
                _id: '$batchDetails._id', 
                productId: '$_id',
                product: 1, // FIXED: Was 'name: 1'
                brand: 1,   // NEW: Added brand
                manufacturer: 1,
                form: 1, 
                strength: 1, // NEW: Added strength
                batchNumber: '$batchDetails.batchNumber',
                expiryDate: '$batchDetails.expiryDate',
                storageZone: '$batchDetails.storageZone',
                availableStock: { 
                    $subtract: ['$batchDetails.totalQuantity', '$batchDetails.reservedQuantity'] 
                }
            }
        },
        {
            // 5. Enforce FEFO globally across the marketplace
            $sort: { expiryDate: 1 }
        }
    ]);

    // Used your custom ApiResponse class for consistent formatting
    return res.status(200).json(
        new ApiResponse(200, catalogItems, "Catalog batches retrieved successfully")
    );
});

export { getAllCatalogBatches, addProduct, removeBatch };