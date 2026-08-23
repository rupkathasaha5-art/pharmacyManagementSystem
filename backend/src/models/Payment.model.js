import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Org",
      required: true,
      index: true,
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    gateway: {
      type: String,
      enum: ["stripe", "razorpay", "trade_credit", "bank_transfer"],
      required: true,
    },
    paymentMethodType: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet", "credit_line", "bank_transfer"],
      default: "card",
    },
    gatewayTransactionId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["initiated", "succeeded", "failed", "refunded"],
      default: "initiated",
      index: true,
    },
    failureReason: {
      type: String,
      default: null,
    },
    rawGatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    type: {
      type: String,
      enum: ["order_payment", "credit_settlement"],
      default: "order_payment"
    },
  },
  { timestamps: true }
);

paymentSchema.index({ org: 1, createdAt: -1 });

export const Payment = mongoose.model("Payment", paymentSchema);