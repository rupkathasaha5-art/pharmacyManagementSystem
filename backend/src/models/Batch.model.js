import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,//same product will have different batch details
    ref: 'Product',
    required: true
  },
  batchNumber: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    uppercase: true // e.g., "BAT-AMX-2026A"
  },
  
  // Concurrency-Safe Inventory Counters
  totalQuantity: { 
    type: Number, 
    required: true, 
    min: [0, 'Physical warehouse stock cannot drop below 0 items.'] 
  },
  reservedQuantity: { 
    type: Number, 
    default: 0, 
    min: [0, 'Active shopping cart stock locks cannot drop below 0 items.'] 
  },
  
  // Logistics & Warehouse Management (WMS) Parameters
  storageZone: {
    type: String,
    trim: true // e.g., "Aisle-4-Shelf-B" (Aids warehouse fulfillment workers)
  },
  
  // FEFO 
  manufacturingDate: {
    type: Date,
    required: true
  },
  expiryDate: { 
    type: Date, 
    required: true 
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// CRITICAL PERFORMANCE INDEXING: Compounding productId and expiryDate 
// ensures the database processes near-expiry lots instantly during high-concurrency checkouts.
batchSchema.index({ productId: 1, expiryDate: 1 });

export default mongoose.model('Batch', batchSchema);