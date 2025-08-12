import mongoose from "mongoose";

// Helper to convert UTC timestamps to IST
function toIST(date) {
  if (!date) return date; // avoid error if date is undefined/null
  const offset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + offset);
}

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [3, "Product name must be at least 3 characters long"],
      maxlength: [100, "Product name must be under 100 characters"],
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      minlength: [10, "Description should be at least 10 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be a positive number"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      default: "Generic",
    },
    stock: {
      type: Number,
      required: [true, "Stock count is required"],
      min: [0, "Stock cannot be negative"],
    },
    images: [
      {
        public_id: { type: String },
        url: { type: String },
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.createdAt = toIST(ret.createdAt);
        ret.updatedAt = toIST(ret.updatedAt);
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Product = mongoose.model("product", productSchema);
export default Product;
