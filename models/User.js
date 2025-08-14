import mongoose from "mongoose";

function toIST(date) {
  if (!date) return date;
  const offset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + offset);
}

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [
        function () {
          return !this.googleId;
        },
        "Full name is required",
      ],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      unique: true,
      match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
      required: [
        function () {
          return !this.googleId;
        },
        "Password is required",
      ],
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
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    refreshToken: {
      type: String,
      select: false,
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
        delete ret.refreshToken;
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
        delete ret.refreshToken;
        return ret;
      },
    },
  }
);

// Ensure unique email & mobile
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ mobile: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);
export default User;
