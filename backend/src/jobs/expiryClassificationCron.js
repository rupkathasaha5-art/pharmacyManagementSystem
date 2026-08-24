import cron from "node-cron";
import BatchInventory from "../models/BatchInventory.model.js";
import ManufacturerReturn from "../models/ManufacturerReturn.model.js";

const DAYS_90 = 90 * 24 * 60 * 60 * 1000;
const DAYS_365 = 365 * 24 * 60 * 60 * 1000;

export const classifyBatchesByExpiry = async () => {
  try {
    console.log("⏰ [CRON] Running daily batch expiry classification...");

    const now = new Date();
    const in90Days = new Date(now.getTime() + DAYS_90);
    const in1Year = new Date(now.getTime() + DAYS_365);

   // RED — expiring in under 90 days. Snapshot for audit, then soft-remove
// (isActive: false) rather than delete, so past orders can still resolve
// their batch reference and a misclassification can be reversed.
    const redBatches = await BatchInventory.find({
      isActive: true,
      expiryDate: { $lt: in90Days }
    }).populate('product', 'product');

    if (redBatches.length > 0) {
      const returnRecords = redBatches.map((batch) => ({
        product: batch.product?._id,
        productName: batch.product?.product || 'Unknown Product',
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantityReturned: batch.quantityInStock,
        supplierName: batch.supplierName,
      }));

      await ManufacturerReturn.insertMany(returnRecords);

      const redIds = redBatches.map((b) => b._id);
      await BatchInventory.updateMany(
  { _id: { $in: redIds } },
  { $set: { isActive: false, expiryStatus: 'red', quantityInStock: 0 } }
);
    }

    // YELLOW — 90 days to 1 year out. Flagged for the discounted/clearance catalog.
    const yellowResult = await BatchInventory.updateMany(
      {
        isActive: true,
        expiryDate: { $gte: in90Days, $lt: in1Year }
      },
      { $set: { expiryStatus: 'yellow' } }
    );

    // GREEN — everything else (more than 1 year out). Also re-classifies any
    // batch whose expiry was corrected/extended back to green.
    const greenResult = await BatchInventory.updateMany(
      {
        isActive: true,
        expiryDate: { $gte: in1Year }
      },
      { $set: { expiryStatus: 'green' } }
    );
    console.log(`🔴 [CRON] ${redBatches.length} batch(es) returned to manufacturer & deactivated.`);
    console.log(`🟡 [CRON] ${yellowResult.modifiedCount} batch(es) marked yellow (clearance).`);
    console.log(`🟢 [CRON] ${greenResult.modifiedCount} batch(es) marked green (main catalog).`);
    console.log("✅ [CRON] Expiry classification completed.");
  } catch (error) {
    console.error("❌ [CRON ERROR] Failed during expiry classification:", error);
  }
};

export const initExpiryClassificationJob = () => {
  // Runs at 00:10, just after the credit-freeze audit (00:05), to avoid overlap
  cron.schedule("10 0 * * *", classifyBatchesByExpiry);
  console.log("⏳ [CRON INITIALIZED] Daily batch expiry classification running at 00:10 AM.");
};