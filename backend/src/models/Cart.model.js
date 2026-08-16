import mongoose from 'mongoose';

// Define EXACTLY what a cart item is allowed to contain
const cartItemSchema = new mongoose.Schema({
  // Your frontend context deliberately maps the batchNumber to the _id
  _id: { 
    type: String, 
    required: true 
  }, 
  
  // --- NEW: Relational Links ---
  // Links directly to the new Product and BatchInventory schemas
  productRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  batchRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BatchInventory'
  },

  // --- Snapshotted Fields ---
  // Kept here for fast frontend rendering and to prevent cart corruption
  // if master product data is edited while an item is in the cart.
  product: { 
    type: String, 
    required: true 
  },
  batchNumber: { 
    type: String, 
    required: true 
  },
  manufacturer: { 
    type: String 
  },
  packSize: { 
    type: String 
  },
  salesRate: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  mrp: { 
    type: Number, 
    min: 0 
  },
  orderQuantity: { 
    type: Number, 
    required: true, 
    min: 1 // Prevents users from ordering 0 or negative items via API manipulation
  },
  totalStock: { 
    type: Number, 
    default: 0 
  }
}, { _id: false }); // CRITICAL: Tells Mongoose not to auto-generate an ObjectId here because we are providing our own String _id

const cartSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true // Each user gets exactly 1 cart document
  },
  // Replaced the loose 'Array' with our strict array of cartItemSchemas
  items: [cartItemSchema] 
}, { timestamps: true });

export const Cart = mongoose.model('Cart', cartSchema);