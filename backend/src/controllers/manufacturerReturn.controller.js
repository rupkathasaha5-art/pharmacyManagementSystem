import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ManufacturerReturn from "../models/ManufacturerReturn.model.js";

// GET /api/v1/manufacturer-returns?status=pending_return|returned
export const getManufacturerReturns = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = status ? { status } : {};
  const returns = await ManufacturerReturn.find(filter)
    .populate('confirmedBy', 'name email')
    .sort({ createdAt: -1 });

  const summary = await ManufacturerReturn.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 }, totalQty: { $sum: '$quantityReturned' } } }
  ]);

  const summaryMap = {};
  summary.forEach((s) => { summaryMap[s._id] = { count: s.count, totalQty: s.totalQty }; });

  return res.status(200).json(
    new ApiResponse(200, {
      returns,
      summary: {
        pendingCount: summaryMap.pending_return?.count || 0,
        pendingQty: summaryMap.pending_return?.totalQty || 0,
        returnedCount: summaryMap.returned?.count || 0,
        returnedQty: summaryMap.returned?.totalQty || 0,
      }
    }, "Manufacturer returns fetched.")
  );
});

// PATCH /api/v1/manufacturer-returns/:id/confirm
// Marks a flagged return as actually completed — the manufacturer has
// taken the stock back and (optionally) issued a credit note.
export const confirmManufacturerReturn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { creditNoteNumber, notes } = req.body;

  const returnRecord = await ManufacturerReturn.findById(id);
  if (!returnRecord) throw new ApiError(404, "Return record not found.");

  if (returnRecord.status === 'returned') {
    throw new ApiError(400, "This return has already been confirmed.");
  }

  returnRecord.status = 'returned';
  returnRecord.confirmedAt = new Date();
  returnRecord.confirmedBy = req.user._id;
  returnRecord.creditNoteNumber = creditNoteNumber || null;
  returnRecord.notes = notes || null;
  await returnRecord.save();

  return res.status(200).json(new ApiResponse(200, returnRecord, "Return confirmed."));
});