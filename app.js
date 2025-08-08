import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import connectionToMongoDB from "./config/database.js";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SrijanMithila API",
      version: "1.0.0",
      description: "Auto-generated Swagger docs",
    },
    servers: [
      {
        url: `https://srijanmithilabackend.onrender.com`,
      },
    ],
  },
  apis: ["./routes/*.js", "./app.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);

// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// 🔐 Manual MongoDB sanitization (Safe for Express 4+)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.query) mongoSanitize.sanitize(req.query);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// Root Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the SrijanMithila API Server!",
    docs: "/api-docs",
    status: "Running",
    env: process.env.NODE_ENV || "development",
  });
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome route
 *     description: Returns a welcome message with link to docs.
 *     responses:
 *       200:
 *         description: Successful response with welcome message
 */

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({
    message: "Server Error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// Start server and connect DB
const startServer = async () => {
  try {
    await connectionToMongoDB();
    app.listen(PORT, () => {
      console.log(
        `Server running at https://srijanmithilabackend.onrender.com`
      );
      console.log(
        `Swagger docs at https://srijanmithilabackend.onrender.com/api-docs`
      );
    });
  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();

export default app;
