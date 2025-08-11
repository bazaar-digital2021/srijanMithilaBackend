import express from "express";
import { OAuth2Client } from "google-auth-library";

import User from "../models/User.js";
import {
  signAccessToken,
  signRefreshToken,
} from "../utils/googleLoginMiddleware.js";

const router = express.Router();
console.log("Google Auth Router initialized");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
console.log("OAuth2Client instance created:", client);

router.post("/google", async (req, res) => {
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

    const { email, name, email_verified } = payload;

    if (!email_verified) {
      console.warn(`Email not verified: ${email}`);
      return res.status(401).json({ message: "Email not verified by Google" });
    }

    // Find user by email
    console.log(`Looking up user with email: ${email}`);
    let user = await User.findOne({ email });

    if (!user) {
      console.log("User not found, creating a new user");
      // Create new user with dummy password (not used for Google login)
      user = new User({
        fullName: name,
        email,
        password: Math.random().toString(36).slice(-8),
      });

      try {
        await user.save();
        console.log("New user saved:", user._id);
      } catch (saveError) {
        console.error("Error saving new user:", saveError);
        return res
          .status(500)
          .json({ message: "Internal server error while saving user" });
      }
    } else {
      console.log("User found:", user._id);
    }

    // Generate JWT tokens
    console.log("Generating access and refresh tokens");
    const accessToken = await signAccessToken(user._id);
    const refreshToken = await signRefreshToken(user._id);

    console.log("Tokens generated successfully");

    // Optionally save refreshToken in DB or send to client only
    // ...

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

    // Handle other specific GoogleAuth errors if needed here

    return res.status(500).json({
      message: "Internal server error during Google login",
      error: error.message || error.toString(),
    });
  }
});

export default router;
