// server.js or app.js

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import connectionToMongoDB from "./config/database.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Set security-related HTTP headers
app.use(helmet());

// Enable CORS with proper configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*", // Change to specific domain in production
    credentials: true,
  })
);

// Parse incoming JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Prevent NoSQL injection (defensive setup)
app.use(
  mongoSanitize({
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized ${key}:`, req[key]);
    },
    replaceWith: "_", // Replace dangerous characters with _
  })
);

// Apply rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// Simple test route
app.get("/", (req, res) => {
  res.status(200).json({ message: "API is running securely" });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    message: "Server Error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// Start server only after DB connection
const startServer = async () => {
  try {
    await connectionToMongoDB(); // Logs successful MongoDB connection
    app.listen(PORT, () => {
      console.log(`Your app is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();

export default app;
