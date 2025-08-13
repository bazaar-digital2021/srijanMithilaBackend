// models/Payment.js
import mongoose from "mongoose";

const RefundSchema = new mongoose.Schema(
  {
    refundId: { type: String, index: true },
    amount: Number, // in paise
    status: String, // processed, failed, pending
    createdAt: Date,
  },
  { _id: false }
);

const PaymentSchema = new mongoose.Schema(
  {
    // Your business identifiers
    orderId: { type: String, index: true }, // your internal order ref (optional)
    customerId: { type: String, index: true }, // your user id (optional)

    // Razorpay entities
    rpOrderId: { type: String, index: true, unique: true }, // razorpay_order_id
    rpPaymentId: { type: String, index: true }, // razorpay_payment_id (post success)
    currency: { type: String, default: "INR" },
    amount: { type: Number, required: true }, // paise

    status: {
      type: String,
      enum: [
        "created", // order created
        "attempted",
        "authorized",
        "captured",
        "failed",
        "refunded",
        "partially_refunded",
        "cancelled", // manual cancel logic (order invalidated)
      ],
      default: "created",
      index: true,
    },

    method: { type: String }, // card/upi/netbanking/wallet
    email: { type: String },
    contact: { type: String }, // phone

    lastEvent: { type: String },
    metadata: { type: Object, default: {} },
    refunds: [RefundSchema],

    // Idempotency key per action (create / refund / cancel)
    idemCreateKey: { type: String, index: true },
    idemRefundKeys: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("Payment", PaymentSchema);
