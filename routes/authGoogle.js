// routes/authGoogle.js
import express from "express";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import {
  signAccessToken,
  signRefreshToken,
} from "../utils/googleLoginMiddleware.js";

// Load environment variables
dotenv.config();

// Validate environment variables early
if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID is not set in environment variables");
}
if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT_ACCESS_SECRET or JWT_REFRESH_SECRET is not set");
}

const router = express.Router();
console.log("Google Auth Router initialized");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/", async (req, res) => {
  try {
    const { idToken } = req.body;
    console.log("Received idToken:", idToken);

    if (!idToken) {
      console.warn("No idToken provided in request body");
      return res.status(400).json({ message: "idToken is required" });
    }

    // Verify token with Google
    console.log("Verifying Google ID token...");
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log("Google token payload:", payload);

    if (!payload) {
      console.error("Failed to get payload from Google token");
      return res
        .status(401)
        .json({ message: "Invalid Google ID token payload" });
    }

    const { email, email_verified } = payload;

    if (!email_verified) {
      console.warn(`Email not verified: ${email}`);
      return res.status(401).json({ message: "Email not verified by Google" });
    }

    // Find or create user
    console.log(`Looking up user with email: ${email}`);
    let user = await User.findOne({ email });

    if (!user) {
      console.log("User not found, creating a new user");

      // Generate a salted & hashed dummy password
      const dummyPassword = Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(dummyPassword, salt);

      user = new User({
        fullName: payload.name || email.split("@")[0],
        email,
        password: hashedPassword, // stored hashed password
        googleId: payload.sub,
      });

      try {
        await user.save();
        console.log("New user saved:", user._id);
      } catch (saveError) {
        console.error("Error saving new user:", saveError);
        return res.status(500).json({ message: "Error saving user" });
      }
    } else {
      console.log("User found:", user._id);
    }

    // Generate JWT tokens
    console.log("Generating access and refresh tokens");
    const accessToken = await signAccessToken(user._id.toString());
    const refreshToken = await signRefreshToken(user._id.toString());
    console.log("Tokens generated successfully");

    return res.status(200).json({
      message: "Google login successful",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);

    if (error?.response?.status === 401) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid Google ID token" });
    }

    return res.status(500).json({
      message: "Internal server error during Google login",
      error: error.message || error.toString(),
    });
  }
});

export default router;
