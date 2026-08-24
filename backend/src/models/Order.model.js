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
  paymentMethod: {
    type: String,
    enum: ['net_14', 'immediate'],
    required: [true, 'Payment method is required']
  },
  status: {
  type: String,
  // pending_payment: immediate-payment order created, awaiting Stripe confirmation
  // placed: confirmed order (credit approved, or payment verified) — ready for fulfillment
  // out_for_delivery: driver has picked up the order
  // delivered: driver confirmed drop-off via OTP
  // cancelled: cancelled by ORG_ADMIN (or system, for abandoned pending_payment orders)
  enum: ['pending_payment', 'placed', 'out_for_delivery', 'delivered', 'cancelled','delivery-failed'],
  default: 'placed'
  },
  // Tracks whether THIS specific order's balance has been paid off via credit
// settlement — independent of fulfillment status. Needed because org-level
// currentOutstanding alone can't tell you which invoice(s) it corresponds to.
creditSettled: { type: Boolean, default: false },
creditSettledAt: { type: Date, default: null },
amountSettled: { type: Number, default: 0, min: 0 }, // running total paid toward this orde
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
  },
  deliveryOtp: { type: String, select: false },       // hashed, never returned by default
  deliveryOtpExpiresAt: { type: Date, select: false },
  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  outForDeliveryAt: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancellationReason: { type: String, trim: true },

  deliveryException: { type: String, trim: true, default: null }, // e.g. "Shop Closed"
  deliveryExceptionAt: { type: Date, default: null },
  deliveryExceptionReportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  }, { timestamps: true });

orderSchema.index({ buyerOrg: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);