import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // Core Technical Nomenclature
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  strength: { 
    type: String, 
    required: true,
    trim: true // e.g., "500mg", "100 U/mL"
  },
  form: { 
    type: String, 
    required: true,
    trim: true // e.g., "Tablet", "Capsule", "Vial", "Syrup"
  },
  sku: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    uppercase: true // e.g., "SKU-AMX-250-CAP"
  },
  
  // Commercial Procurement Metrics
  wholesalePrice: { 
    type: Number, 
    required: true, 
    min: [0, 'Wholesale case price cannot be a negative value.'] 
  },
  manufacturer: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  
  // Regulatory Risk Classification
  scheduleClass: {
    type: String,
    enum: ['Rx-Only', 'Schedule-II', 'Schedule-IV', 'Over-The-Counter'],
    default: 'Rx-Only'
  },
  requiresColdChain: {
    type: Boolean,
    default: false // Toggled to true for items like Insulin requiring 2°C–8°C storage
  }
},{timestamps:true});

// Create text indexes to support rapid frontend marketplace search queries
productSchema.index({ name: 'text', manufacturer: 'text', sku: 'text' });

export default mongoose.model('Product', productSchema);