import mongoose from 'mongoose';


const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BatchInventory',
    required: true
  },
  
  productName: { type: String, required: true, trim: true },
  hsn: { type: String, trim: true },
  batchNumber: { type: String, required: true, trim: true },
  expiryDate: { type: Date, required: true },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  rate: {
    type: Number,
    required: true,
    min: [0, 'Rate cannot be negative']
  },
  gst: {
    cgst: { type: Number, default: 0, min: 0 },
    sgst: { type: Number, default: 0, min: 0 },
    igst: { type: Number, default: 0, min: 0 }
  },
  lineTotal: {
    type: Number, // (qty * rate) + gst for this line
    required: true,
    min: [0, 'Line total cannot be negative']
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  buyerOrg: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Org',
    required: [true, 'Buyer organization is required']
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: (items) => Array.isArray(items) && items.length > 0,
      message: 'Order must contain at least one item'
    }
  },
  orderTotal: {
    type: Number,
    required: true,
    min: [0, 'Order total cannot be negative']
  },
  status: {
    type: String,
    enum: ['placed', 'invoiced', 'delivered', 'cancelled'],
    default: 'placed'
  },
  
  invoiceNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // so orders without an invoice yet don't break the unique index
  },
  invoiceDate: {
    type: Date
  },
  dueDate: {
    type: Date
  }
}, { timestamps: true });

orderSchema.index({ buyerOrg: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);