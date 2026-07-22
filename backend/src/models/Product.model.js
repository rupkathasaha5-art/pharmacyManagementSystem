import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // --- Identity ---
  product: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  genericName: {
    type: String, // Paracetamol 500mg + Caffeine 30mg
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
    type: String, // e.g. Antibiotic, Analgesic, Antacid
    trim: true
  },
  form: {
    type: String, // Tablet, Syrup, Injection, Capsule, etc.
    trim: true
  },
  strength: {
    type: String, // e.g. "500mg"
    trim: true
  },
  packSize: {
    type: String, // e.g. "10x10", "1x100ml"
    trim: true
  },
  scheduleType: {
    type: String,
    enum: ['OTC', 'H', 'H1', 'X', 'G', 'Other'],
    default: 'OTC'
  },
  storageCondition: {
    type: String, // e.g. "Cool & Dry Place", "2-8°C"
    trim: true
  },

  // --- Regulatory / Classification codes ---
  hsn: {
    type: String,
    trim: true
  },
  barcode: {
    type: String,
    trim: true
  },

  // --- Finance ---
  mrp: {
    type: Number,
    min: [0, 'MRP cannot be negative']
  },
  purchaseRate: {
    type: Number, // cost price per unit/pack from supplier
    min: [0, 'Purchase rate cannot be negative']
  },
  salesRate: {
    type: Number, // selling price per unit/pack to buyer
    min: [0, 'Sales rate cannot be negative']
  },
  marginPercent: {
    type: Number,
    min: [0, 'Margin cannot be negative']
  },
  gst: {
    cgst: { type: Number, default: 0, min: 0 },
    sgst: { type: Number, default: 0, min: 0 },
    igst: { type: Number, default: 0, min: 0 }
  },
  taxInclusive: {
    type: Boolean,
    default: false // whether purchaseRate/salesRate already include GST
  },

  // --- Status ---
  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

productSchema.index({ product: 'text', brand: 'text', manufacturer: 'text', genericName: 'text' });

export default mongoose.model('Product', productSchema);