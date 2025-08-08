import mongoose from "mongoose";

// Helper to convert UTC timestamps to IST
function toIST(date) {
  const offset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
  return new Date(date.getTime() + offset);
}

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.createdAt = toIST(ret.createdAt);
        ret.updatedAt = toIST(ret.updatedAt);
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.createdAt = toIST(ret.createdAt);
        ret.updatedAt = toIST(ret.updatedAt);
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// Index for faster lookup by email
userSchema.index({ email: 1 });

const User = mongoose.model("User", userSchema);
export default User;
