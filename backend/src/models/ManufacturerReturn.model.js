import mongoose from 'mongoose';

const manufacturerReturnSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  batchNumber: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  quantityReturned: { type: Number, required: true },
  supplierName: { type: String },

  // NEW: tracks whether the physical return has actually happened yet,
  // separate from when the batch was first flagged red by the cron
  status: {
    type: String,
    enum: ['pending_return', 'returned'],
    default: 'pending_return'
  },
  creditNoteNumber: { type: String, trim: true, default: null }, // manufacturer's RMA/credit reference, once available
  confirmedAt: { type: Date, default: null },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  notes: { type: String, trim: true, default: null },
}, { timestamps: true }); // createdAt = when the cron flagged/logged it

manufacturerReturnSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('ManufacturerReturn', manufacturerReturnSchema);