import mongoose from 'mongoose';


const batchInventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true
  },
  manufacturingDate: {
    type: Date
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  quantityInStock: {
    type: Number,
    required: true,
    min: [0, 'Stock quantity cannot be negative'],
    default: 0
  },
 
  mrp: {
    type: Number,
    required: [true, 'MRP is required'],
    min: [0, 'MRP cannot be negative']
  },
  purchaseRate: {
    type: Number, //what we paid the supplier for this lot
    required: [true, 'Purchase rate is required'],
    min: [0, 'Purchase rate cannot be negative']
  },
  salesRate: {
    type: Number, //what we sell this lot at
    required: [true, 'Sales rate is required'],
    min: [0, 'Sales rate cannot be negative']
  },
  marginPercent: {
    type: Number, // auto-calculated 
    min: [0, 'Margin cannot be negative']
  },
  taxInclusive: {
    type: Boolean,
    default: false
  },
  supplierName: {
    type: String,
    trim: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });


batchInventorySchema.pre('save', function () {
  if (this.isModified('purchaseRate') || this.isModified('salesRate')) {
    if (this.purchaseRate > 0) {
      this.marginPercent = ((this.salesRate - this.purchaseRate) / this.purchaseRate) * 100;
    }
  }
  
});

// for FEFO,pulling batches of a product sorted by nearest expiry first
batchInventorySchema.index({ product: 1, expiryDate: 1 });
// stop the same batch getting logged twice for the same product
batchInventorySchema.index({ product: 1, batchNumber: 1 }, { unique: true });

export default mongoose.model('BatchInventory', batchInventorySchema);