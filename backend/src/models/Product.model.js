import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  product: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  genericName: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  form: {
    type: String, 
  },
  strength: {
    type: String, 
    trim: true
  },
  packSize: {
    type: String, //10x10, 1x100ml
    trim: true
  },
  scheduleType: {
    type: String,
    enum: ['OTC', 'H', 'H1', 'X', 'G', 'Other'],
    default: 'OTC'
  },
  storageCondition: {
    type: String, // Cool & Dry Place, 2-8C
    trim: true
  },
  
  hsn: {
    type: String,
    trim: true
  },
  barcode: {
    type: String,
    trim: true
  },
 
  gst: {
    cgst: { type: Number, default: 0, min: 0 },
    sgst: { type: Number, default: 0, min: 0 },
    igst: { type: Number, default: 0, min: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

productSchema.index({ product: 'text', brand: 'text', manufacturer: 'text', genericName: 'text' });

export default mongoose.model('Product', productSchema);