import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  product: { 
    type: String, 
    required: [true, 'Product name is required'], 
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
  strength: { 
    type: String, 
    trim: true 
  },
  form: { 
    type: String, 
    trim: true 
  },
  hsn: {
    type: String,
    trim: true
  },
  salesTax: {
    type: Number, 
    min: [0, 'Tax cannot be negative']
  },
  purchaseTax: {
    type: Number,
    min: [0, 'Tax cannot be negative']
  }

}, { timestamps: true });


productSchema.index({ product: 'text', brand: 'text', manufacturer: 'text' });

export default mongoose.model('Product', productSchema);