import mongoose from "mongoose";

function toIST(date) {
  if (!date) return date; // avoid error if date is undefined/null
  const offset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + offset);
}

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [
        function () {
          return !this.googleId; // required only if NOT Google login
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
    password: {
      type: String,
      minlength: 6,
      select: false,
      required: [
        function () {
          return !this.googleId; // password required only if NOT Google login
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

userSchema.index({ email: 1 });

const User = mongoose.model("User", userSchema);
export default User;
