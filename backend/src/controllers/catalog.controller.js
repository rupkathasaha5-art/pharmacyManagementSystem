import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Product from "../models/Product.model.js";

const VALID_SCHEDULE_TYPES = ["OTC", "H", "H1", "X", "G", "Other"];
const CLEARANCE_DISCOUNT_PERCENT = 40; // adjust as needed

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
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = { isActive: true };
    if (category) matchStage.category = category;
    if (scheduleType) matchStage.scheduleType = scheduleType;
    if (search) matchStage.$text = { $search: search };

    const pipeline = [
        { $match: matchStage },
        {
            // pull in only the batches that are actually sellable right now:
            // in stock, active, not expired, and NOT flagged yellow/red by the
            // nightly expiry-classification cron (those live in the clearance
            // catalog or have already been returned to the manufacturer)
            $lookup: {
                from: 'batchinventories',
                let: { productId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$product', '$$productId'] },
                            isActive: true,
                            quantityInStock: { $gt: 0 },
                            expiryDate: { $gt: new Date() },
                            expiryStatus: 'green'
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

// GET /api/v1/catalog/clearance
// Products with at least one batch flagged 'yellow' by the nightly expiry
// cron (90 days to 1 year from expiry) — shown at a discount to move stock
// before it crosses into the 90-day 'red' window and gets returned.
export const getClearanceCatalog = asyncHandler(async (req, res) => {
    const { search, category, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = { isActive: true };
    if (category) matchStage.category = category;
    if (search) matchStage.$text = { $search: search };

    const pipeline = [
        { $match: matchStage },
        {
            $lookup: {
                from: 'batchinventories',
                let: { productId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$product', '$$productId'] },
                            isActive: true,
                            quantityInStock: { $gt: 0 },
                            expiryDate: { $gt: new Date() },
                            expiryStatus: 'yellow'
                        }
                    },
                    { $sort: { expiryDate: 1 } } // soonest-expiring clearance stock shown first
                ],
                as: 'batches'
            }
        },
        // Only keep products that actually have a yellow batch — otherwise every
        // product in the catalog would show up here with an empty batches array
        { $match: { 'batches.0': { $exists: true } } },
        {
            $addFields: {
                totalStock: { $sum: '$batches.quantityInStock' },
                displayBatch: { $arrayElemAt: ['$batches', 0] }
            }
        },
        {
            $addFields: {
                originalRate: '$displayBatch.salesRate',
                salesRate: {
                    $round: [
                        { $multiply: ['$displayBatch.salesRate', (100 - CLEARANCE_DISCOUNT_PERCENT) / 100] },
                        2
                    ]
                },
                discountPercent: CLEARANCE_DISCOUNT_PERCENT
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
                originalRate: 1,
                salesRate: 1, // discounted price — kept as `salesRate` so cart/checkout logic needs no changes
                discountPercent: 1,
                batchNumber: '$displayBatch.batchNumber',
                expiryDate: '$displayBatch.expiryDate'
            }
        },
        { $sort: { 'displayBatch.expiryDate': 1 } },
        { $skip: skip },
        { $limit: limitNum }
    ];

    const products = await Product.aggregate(pipeline);

    // Approximate count for pagination — counts products with ANY yellow batch,
    // cheaper than re-running the full pipeline just to get a total
    const totalCountResult = await Product.aggregate([
        { $match: matchStage },
        {
            $lookup: {
                from: 'batchinventories',
                let: { productId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$product', '$$productId'] },
                            isActive: true,
                            expiryStatus: 'yellow',
                            quantityInStock: { $gt: 0 }
                        }
                    }
                ],
                as: 'batches'
            }
        },
        { $match: { 'batches.0': { $exists: true } } },
        { $count: 'total' }
    ]);

    const totalCount = totalCountResult[0]?.total || 0;

    return res.status(200).json(
        new ApiResponse(200, {
            products,
            discountPercent: CLEARANCE_DISCOUNT_PERCENT,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / limitNum)
            }
        }, 'Clearance catalog fetched successfully.')
    );
});