import { Router } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/User.js";
import Otp from "../models/Otp.js";
import fetchData from "../middleware/fetchData.js";
import { sendOtpSms } from "../service/twilioService.js";

const router = Router();

const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "15m";
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "7d";

/* ===== Utility Functions ===== */
function signToken(payload, secretEnvName, expiresIn) {
  const secret = process.env[secretEnvName];
  if (!secret) {
    const err = new Error(`Missing env var ${secretEnvName}`);
    err.statusCode = 500;
    throw err;
  }
  return jwt.sign(payload, secret, { expiresIn });
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000)); // 6 digit OTP
}

async function setOtpForMobile({ mobile, context, otp, payload }) {
  const otpHash = await bcrypt.hash(otp, 12);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
  await Otp.findOneAndUpdate(
    { mobile, context },
    { otpHash, expiresAt, payload: payload ?? null },
    { upsert: true, new: true }
  );
}

async function getCooldownSeconds(mobile, context) {
  const doc = await Otp.findOne({ mobile, context });
  if (doc && doc.expiresAt > new Date()) {
    return Math.ceil((doc.expiresAt - new Date()) / 1000);
  }
  return 0;
}

function normalizeMobile(mobile) {
  let m = mobile.trim();
  if (/^[6-9]\d{9}$/.test(m)) {
    return `+91${m}`;
  }
  if (/^\+91[6-9]\d{9}$/.test(m)) {
    return m;
  }
  throw new Error("Invalid Indian mobile number");
}

/* ===================== SIGNUP (SEND OTP) ===================== */
router.post(
  "/signup",
  [
    body("fullName").trim().notEmpty().withMessage("Full name is required"),
    body("email").trim().notEmpty().isEmail(),
    body("password").notEmpty().isLength({ min: 8 }),
    body("mobile").matches(/^[6-9]\d{9}$/),
    body("role").optional().isIn(["user", "admin"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    let { fullName, email, password, mobile, role } = req.body;
    try {
      mobile = normalizeMobile(mobile);

      if (await User.findOne({ email }))
        return res.status(400).json({ message: "Email already registered" });
      if (await User.findOne({ mobile }))
        return res.status(400).json({ message: "Mobile already registered" });

      const cooldown = await getCooldownSeconds(mobile, "signup");
      if (cooldown > 0) {
        return res
          .status(429)
          .json({
            message: `Please wait ${cooldown}s before requesting a new OTP`,
          });
      }

      const otp = generateOtp();
      const hashedPassword = await bcrypt.hash(password, 12);

      await setOtpForMobile({
        mobile,
        context: "signup",
        otp,
        payload: { fullName, email, hashedPassword, role: role || "user" },
      });

      await sendOtpSms(mobile, otp);

      return res
        .status(200)
        .json({ message: "OTP sent to mobile. Verify to complete signup." });
    } catch (err) {
      console.error("Signup error:", err);
      return res.status(500).json({ message: "Failed to send OTP" });
    }
  }
);

/* ===================== SIGNUP (VERIFY OTP) ===================== */
router.post(
  "/signup/verify-otp",
  [
    body("mobile")
      .trim()
      .matches(/^[6-9]\d{9}$/),
    body("otp").trim().isLength({ min: 6, max: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    let { mobile, otp } = req.body;
    try {
      mobile = normalizeMobile(mobile);

      const otpDoc = await Otp.findOne({ mobile, context: "signup" });
      if (!otpDoc) return res.status(400).json({ message: "OTP not found" });
      if (otpDoc.expiresAt < new Date())
        return res.status(400).json({ message: "OTP expired" });

      const ok = await bcrypt.compare(otp, otpDoc.otpHash);
      if (!ok) return res.status(400).json({ message: "Invalid OTP" });

      const { fullName, email, hashedPassword, role } = otpDoc.payload || {};
      if (!fullName || !email || !hashedPassword)
        return res.status(400).json({ message: "Signup data missing" });

      if (await User.findOne({ $or: [{ email }, { mobile }] })) {
        await Otp.deleteOne({ _id: otpDoc._id });
        return res
          .status(409)
          .json({ message: "Email or mobile already in use" });
      }

      const user = await User.create({
        fullName,
        email,
        password: hashedPassword,
        mobile,
        role: role || "user",
      });

      const accessToken = signToken(
        { userId: user._id },
        "JWT_ACCESS_SECRET",
        ACCESS_TOKEN_EXPIRES
      );
      const refreshToken = signToken(
        { userId: user._id },
        "JWT_REFRESH_SECRET",
        REFRESH_TOKEN_EXPIRES
      );

      user.refreshToken = refreshToken;
      await user.save();
      await Otp.deleteOne({ _id: otpDoc._id });

      return res.status(201).json({
        message: "Signup successful",
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("Signup verify error:", err);
      return res.status(500).json({ message: "Failed to complete signup" });
    }
  }
);

/* ===================== LOGIN (SEND OTP) ===================== */
router.post(
  "/login/send-otp",
  [body("identifier").trim().notEmpty()],
  async (req, res) => {
    const { identifier } = req.body;
    try {
      let mobile = null;
      let user = null;

      if (/^[6-9]\d{9}$/.test(identifier)) {
        mobile = normalizeMobile(identifier);
        user = await User.findOne({ mobile });
      } else if (/^\+91[6-9]\d{9}$/.test(identifier)) {
        mobile = normalizeMobile(identifier);
        user = await User.findOne({ mobile });
      } else {
        user = await User.findOne({ email: identifier.toLowerCase() });
        if (user) mobile = user.mobile;
      }

      if (!user) return res.status(404).json({ message: "User not found" });

      const cooldown = await getCooldownSeconds(mobile, "login");
      if (cooldown > 0) {
        return res
          .status(429)
          .json({
            message: `Please wait ${cooldown}s before requesting a new OTP`,
          });
      }

      const otp = generateOtp();
      await setOtpForMobile({ mobile, context: "login", otp });
      await sendOtpSms(mobile, otp);

      return res.status(200).json({ message: "OTP sent for login" });
    } catch (err) {
      console.error("Login send OTP error:", err);
      return res.status(500).json({ message: "Failed to send OTP" });
    }
  }
);

/* ===================== LOGIN (VERIFY OTP) ===================== */
router.post(
  "/login",
  [
    body("identifier").trim().notEmpty(),
    body("otp").isLength({ min: 6, max: 6 }),
  ],
  async (req, res) => {
    const { identifier, otp } = req.body;
    try {
      let user = null;
      let mobile = null;

      if (/^[6-9]\d{9}$/.test(identifier)) {
        mobile = normalizeMobile(identifier);
        user = await User.findOne({ mobile });
      } else if (/^\+91[6-9]\d{9}$/.test(identifier)) {
        mobile = normalizeMobile(identifier);
        user = await User.findOne({ mobile });
      } else {
        user = await User.findOne({ email: identifier.toLowerCase() });
        if (user) mobile = user.mobile;
      }

      if (!user) return res.status(404).json({ message: "User not found" });

      const otpDoc = await Otp.findOne({ mobile, context: "login" });
      if (!otpDoc) return res.status(400).json({ message: "OTP not found" });
      if (otpDoc.expiresAt < new Date())
        return res.status(400).json({ message: "OTP expired" });

      const ok = await bcrypt.compare(otp, otpDoc.otpHash);
      if (!ok) return res.status(400).json({ message: "Invalid OTP" });

      await Otp.deleteOne({ _id: otpDoc._id });

      const accessToken = signToken(
        { userId: user._id },
        "JWT_ACCESS_SECRET",
        ACCESS_TOKEN_EXPIRES
      );
      const refreshToken = signToken(
        { userId: user._id },
        "JWT_REFRESH_SECRET",
        REFRESH_TOKEN_EXPIRES
      );

      user.refreshToken = refreshToken;
      await user.save();

      return res.status(200).json({
        message: "Login successful",
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("Login verify OTP error:", err);
      return res.status(500).json({ message: "Failed to complete login" });
    }
  }
);

/* ===================== GET LOGGED-IN USER ===================== */
router.get("/me", fetchData, async (req, res) => {
  try {
    const user = await User.findById(req.user).select(
      "fullName email mobile role isActive refreshToken"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const accessToken = signToken(
      { userId: user._id },
      "JWT_ACCESS_SECRET",
      ACCESS_TOKEN_EXPIRES
    );

    return res.status(200).json({
      message: "User data fetched successfully",
      accessToken,
      refreshToken: user.refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Get /me error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
