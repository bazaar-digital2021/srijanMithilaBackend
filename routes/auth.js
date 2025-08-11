import { Router } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import fetchData from "../middleware/fetchData.js";

const router = Router();

// Read env values directly (ensures latest values from process.env)
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "15m";
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "7d";

// helper to sign a token and handle missing secret clearly
function signToken(payload, secretEnvName, expiresIn) {
  const secret = process.env[secretEnvName];
  if (!secret) {
    const err = new Error(
      `Missing env var ${secretEnvName}. Set it in your .env (no quotes)`
    );
    err.statusCode = 500;
    throw err;
  }

  // jwt.sign can throw if secret is invalid — let caller handle it
  return jwt.sign(payload, secret, { expiresIn });
}

// ========================== SIGNUP ===============================
router.post(
  "/signup",
  [
    body("fullName")
      .trim()
      .notEmpty()
      .withMessage("Full name is required")
      .isLength({ min: 3, max: 100 })
      .withMessage("Full name must be between 3 and 100 characters"),

    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail(),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/[a-z]/)
      .withMessage("Must contain lowercase letter")
      .matches(/[A-Z]/)
      .withMessage("Must contain uppercase letter")
      .matches(/[0-9]/)
      .withMessage("Must contain a number")
      .matches(/[^A-Za-z0-9]/)
      .withMessage("Must contain a special character"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    const { fullName, email, password } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser)
        return res.status(400).json({ message: "Email already registered" });

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        fullName,
        email,
        password: hashedPassword,
      });

      // Sign tokens using process.env with guard
      let accessToken, refreshToken;
      try {
        accessToken = signToken(
          { userId: user._id },
          "JWT_ACCESS_SECRET",
          ACCESS_TOKEN_EXPIRES
        );
        refreshToken = signToken(
          { userId: user._id },
          "JWT_REFRESH_SECRET",
          REFRESH_TOKEN_EXPIRES
        );
      } catch (err) {
        console.error("JWT sign error:", err.message);
        // If token signing fails, remove the newly created user to avoid partial state (optional)
        // await User.findByIdAndDelete(user._id).catch(() => {});
        return res
          .status(err.statusCode || 500)
          .json({ message: err.message || "Token creation failed" });
      }

      user.refreshToken = refreshToken;
      await user.save();

      res.status(201).json({
        message: "User registered successfully",
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ========================== LOGIN ===============================
router.post(
  "/login",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email }).select("+password");
      if (!user)
        return res.status(401).json({ message: "Invalid credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(401).json({ message: "Invalid credentials" });

      // Sign tokens with guard
      let accessToken, refreshToken;
      try {
        accessToken = signToken(
          { userId: user._id },
          "JWT_ACCESS_SECRET",
          ACCESS_TOKEN_EXPIRES
        );
        refreshToken = signToken(
          { userId: user._id },
          "JWT_REFRESH_SECRET",
          REFRESH_TOKEN_EXPIRES
        );
      } catch (err) {
        console.error("JWT sign error:", err.message);
        return res
          .status(err.statusCode || 500)
          .json({ message: err.message || "Token creation failed" });
      }

      user.refreshToken = refreshToken;
      await user.save();

      res.status(200).json({
        message: "Login successful",
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ========================== REFRESH TOKEN ===============================
router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;
  console.log("RefreshToken: ", refreshToken);

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      return res
        .status(500)
        .json({ message: "Missing JWT_REFRESH_SECRET in server config" });
    }

    // Verify the token signature and expiration
    const decoded = jwt.verify(refreshToken, secret);

    // Find the user by userId in token payload
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    // Since you are NOT storing refresh tokens in DB, skip token matching

    // Generate a new access token
    const newAccessToken = signToken(
      { userId: user._id },
      "JWT_ACCESS_SECRET",
      ACCESS_TOKEN_EXPIRES
    );

    // Generate a new refresh token (optional, or just reuse old one)
    const newRefreshToken = signToken(
      { userId: user._id },
      "JWT_REFRESH_SECRET",
      REFRESH_TOKEN_EXPIRES
    );

    // No need to save refreshToken to DB since you don't store it

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
  }
});

// ========================== GET LOGGED-IN USER ===============================
router.get("/me", fetchData, async (req, res) => {
  try {
    const user = await User.findById(req.user).select(
      "fullName email refreshToken"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    // create a fresh access token (guarded)
    let accessToken;
    try {
      accessToken = signToken(
        { userId: user._id },
        "JWT_ACCESS_SECRET",
        ACCESS_TOKEN_EXPIRES
      );
    } catch (err) {
      console.error("JWT sign error (me):", err.message);
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message || "Token creation failed" });
    }

    res.status(200).json({
      message: "User data fetched successfully",
      accessToken,
      refreshToken: user.refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Get /me error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
