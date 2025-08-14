import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      match: [/^[6-9]\d{9}$/, "Invalid mobile number"],
      index: true,
    },
    context: {
      type: String,
      enum: ["signup", "login"],
      required: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    payload: {
      type: Object,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-delete expired OTP
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Ensure mobile + context unique
otpSchema.index({ mobile: 1, context: 1 }, { unique: true });

// Ensure OTP value (hashed) is unique across active records
otpSchema.index({ otpHash: 1 }, { unique: true, sparse: true });

export default mongoose.model("Otp", otpSchema);
