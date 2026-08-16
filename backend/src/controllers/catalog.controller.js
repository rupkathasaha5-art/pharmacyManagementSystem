import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Product from "../models/Product.model.js";

const VALID_SCHEDULE_TYPES = ["OTC", "H", "H1", "X", "G", "Other"];


export const addProduct = asyncHandler(async (req, res) => {
    const {
        product,
        genericName,
        brand,
        manufacturer,
        category,
        form,
        strength,
        packSize,
        scheduleType,
        storageCondition,
        hsn,
        gst
    } = req.body;

    
    if (!product?.trim()) {
        throw new ApiError(400, "Product name is required.");
    }

    if (scheduleType && !VALID_SCHEDULE_TYPES.includes(scheduleType)) {
        throw new ApiError(400, `Schedule type must be one of: ${VALID_SCHEDULE_TYPES.join(", ")}`);
    }

   
    const cgst = Number(gst?.cgst) || 0;
    const sgst = Number(gst?.sgst) || 0;
    const igst = Number(gst?.igst) || 0;

    if (cgst < 0 || sgst < 0 || igst < 0) {
        throw new ApiError(400, "GST rates cannot be negative.");
    }

    const newProduct = await Product.create({
        product: product.trim(),
        genericName: genericName?.trim(),
        brand: brand?.trim(),
        manufacturer: manufacturer?.trim(),
        category: category?.trim(),
        form: form?.trim(),
        strength: strength?.trim(),
        packSize: packSize?.trim(),
        scheduleType: scheduleType || "OTC",
        storageCondition: storageCondition?.trim(),
        hsn: hsn?.trim(),
        gst: { cgst, sgst, igst }
    });

    return res.status(201).json(
        new ApiResponse(201, newProduct, `${newProduct.product} has been added to the catalog successfully.`)
    );
});

export const getCatalog = asyncHandler(async (req, res) => {
    const { search, category, scheduleType, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100); // cap so nobody requests 10000 at once
    const skip = (pageNum - 1) * limitNum;

    const matchStage = { isActive: true };
    if (category) matchStage.category = category;
    if (scheduleType) matchStage.scheduleType = scheduleType;
    if (search) matchStage.$text = { $search: search };

    const pipeline = [
        { $match: matchStage },
        {
            // pull in only the batches that are actually sellable right now:
            // in stock, active, not expired
            $lookup: {
                from: 'batchinventories',
                let: { productId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$product', '$$productId'] },
                            isActive: true,
                            quantityInStock: { $gt: 0 },
                            expiryDate: { $gt: new Date() }
                        }
                    },
                    { $sort: { expiryDate: 1 } } // nearest expiry first - FEFO
                ],
                as: 'batches'
            }
        },
        {
            $addFields: {
                totalStock: { $sum: '$batches.quantityInStock' },
                displayBatch: { $arrayElemAt: ['$batches', 0] } // the batch that'll be sold first
            }
        },
        {
            $project: {
                product: 1,
                genericName: 1,
                brand: 1,
                manufacturer: 1,
                category: 1,
                form: 1,
                strength: 1,
                packSize: 1,
                scheduleType: 1,
                storageCondition: 1,
                hsn: 1,
                gst: 1,
                totalStock: 1,
                mrp: '$displayBatch.mrp',
                salesRate: '$displayBatch.salesRate',
                batchNumber: '$displayBatch.batchNumber',
                expiryDate: '$displayBatch.expiryDate'
            }
        },
        { $sort: { product: 1 } },
        { $skip: skip },
        { $limit: limitNum }
    ];

    const products = await Product.aggregate(pipeline);

    // separating lightweight count instead of re-running the batch lookup again
    const totalCount = await Product.countDocuments(matchStage);

    return res.status(200).json(
        new ApiResponse(200, {
            products,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / limitNum)
            }
        }, 'Catalog fetched successfully.')
    );
});