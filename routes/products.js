import { Router } from "express";
import { body, validationResult, param } from "express-validator";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/User.js";
import fetchData from "../middleware/fetchData.js";

const router = Router();

console.log("Product routes loaded");

// Middleware to check admin role after fetchData
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId).select("role");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
  } catch (err) {
    console.error("Admin check error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// CREATE product (admin only)
router.post(
  "/create",
  fetchData,
  requireAdmin,
  [
    body("name")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Name must be at least 3 characters"),
    body("description")
      .isLength({ min: 10 })
      .withMessage("Description must be at least 10 characters"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("category").notEmpty().withMessage("Category is required"),
    body("stock").isInt({ min: 0 }).withMessage("Stock cannot be negative"),
    body("images").optional().isArray(),
    body("isFeatured").optional().isBoolean(),
  ],
  async (req, res) => {
    console.log("POST /product/create route hit");

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      price,
      category,
      brand = "Generic",
      stock,
      images = [],
      isFeatured = false,
    } = req.body;

    try {
      // Check duplicate product name
      const existingProduct = await Product.findOne({ name: name.trim() });
      if (existingProduct) {
        return res
          .status(409)
          .json({ message: "Product with this name already exists" });
      }

      const newProduct = new Product({
        name: name.trim(),
        description,
        price,
        category,
        brand,
        stock,
        images,
        isFeatured,
        createdBy: req.user,
      });

      const savedProduct = await newProduct.save();

      res.status(201).json({
        message: "Product created successfully",
        product: savedProduct,
      });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// UPDATE product by ID (admin only)
router.put(
  "/:id",
  fetchData,
  requireAdmin,
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid product ID"),
    body("name").optional().trim().isLength({ min: 3 }),
    body("description").optional().isLength({ min: 10 }),
    body("price").optional().isFloat({ min: 0 }),
    body("category").optional().notEmpty(),
    body("stock").optional().isInt({ min: 0 }),
    body("images").optional().isArray(),
    body("isFeatured").optional().isBoolean(),
  ],
  async (req, res) => {
    console.log(`PUT /product/${req.params.id} route hit`);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const productId = req.params.id;
      const updateData = req.body;

      // If name is being updated, check for duplicate name
      if (updateData.name) {
        const existingProduct = await Product.findOne({
          name: updateData.name.trim(),
          _id: { $ne: productId }, // exclude current product
        });
        if (existingProduct) {
          return res
            .status(409)
            .json({ message: "Product with this name already exists" });
        }
        updateData.name = updateData.name.trim();
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({
        message: "Product updated successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// DELETE product by ID (admin only)
router.delete(
  "/:id",
  fetchData,
  requireAdmin,
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid product ID"),
  ],
  async (req, res) => {
    console.log(`DELETE /product/${req.params.id} route hit`);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const productId = req.params.id;

      const deletedProduct = await Product.findByIdAndDelete(productId);
      if (!deletedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// GET all products (public)
// router.get("/", async (req, res) => {
//   console.log("GET /product route hit");
//   try {
//     const products = await Product.find({}).populate(
//       "createdBy",
//       "fullName email"
//     );
//     res.json({ products });
//   } catch (error) {
//     console.error("Error fetching products:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

router.get("/", async (req, res) => {
  console.log("GET /product route hit");

  try {
    const products = await Product.find({}).populate(
      "createdBy",
      "fullName email"
    );

    // Group products by category
    const groupedByCategory = products.reduce((acc, product) => {
      const cat = product.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(product);
      return acc;
    }, {});

    res.json({
      productsByCategory: groupedByCategory,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET single product by ID (public)

router.get(
  "/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid product ID"),
  ],
  async (req, res) => {
    console.log(`GET /product/${req.params.id} route hit`);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const product = await Product.findById(req.params.id).populate(
        "createdBy",
        "fullName email"
      );

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Optional: convert createdAt and updatedAt to IST if needed here
      // or rely on your model's toJSON transform

      res.json({ product });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);
export default router;
