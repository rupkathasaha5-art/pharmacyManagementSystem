// product.controller.js
import Product from '../models/Product.model.js';
import Batch from '../models/Batch.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const addProduct = asyncHandler(async (req, res) => {
    const { name, strength, form, sku, wholesalePrice, manufacturer, description, scheduleClass, requiresColdChain } = req.body;

    // 1. Validate required string/number fields
    const requiredFields = ['name', 'strength', 'form', 'sku', 'wholesalePrice', 'manufacturer', 'description', 'scheduleClass'];
    
    for (const field of requiredFields) {
        // Check if the field is missing, null, or an empty string
        if (req.body[field] === undefined || req.body[field] === null || String(req.body[field]).trim() === '') {
            throw new ApiError(400, `${field} is required!!`);
        }
    }

    // 2. Validate boolean field separately (since false is a valid value)
    if (requiresColdChain === undefined || requiresColdChain === null) {
         throw new ApiError(400, `requiresColdChain is required!!`);
    }

    // 3. Check if product already exists
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
        throw new ApiError(409, 'Product with this SKU already exists!!');
    }

    // 4. Create the product
    const newProduct = await Product.create({
        name, strength, form, sku, wholesalePrice, manufacturer, description, scheduleClass, requiresColdChain
    });

    if (!newProduct) {
        throw new ApiError(500, "Could not register the new product!!"); 
    }

    // 5. Send success response
    return res.status(201).json(
        new ApiResponse(201, newProduct, "Registered new product successfully!!")
    );
});

const removeBatch=asyncHandler(async(req,res)=>{//removes an entry from the catalog
    const 
})
 const getAllCatalogBatches = async (req, res) => {
    try {
        const today = new Date();

        const catalogItems = await Product.aggregate([
            {
                // 1. Relate Product to its Batches
                $lookup: {
                    from: 'Batch', 
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
                // 4. Project and clean up fields exactly as needed by the frontend UI cards
                $project: {
                    _id: '$batchDetails._id', // The card's unique key is the Batch ID
                    productId: '$_id',
                    name: 1,
                    manufacturer: 1,
                    form: 1, 
                    wholesalePrice: 1,
                    batchNumber: '$batchDetails.batchNumber',
                    expiryDate: '$batchDetails.expiryDate',
                    storageZone: '$batchDetails.storageZone',
                    availableStock: { 
                        $subtract: ['$batchDetails.totalQuantity', '$batchDetails.reservedQuantity'] 
                    }
                }
            },
            {
                // 5. Enforce FEFO globally across the marketplace (soonest to expire shows first)
                $sort: { expiryDate: 1 }
            }
        ]);

        res.status(200).json({
            success: true,
            count: catalogItems.length,
            data: catalogItems
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

export {getAllCatalogBatches,addProduct,removeBatch}