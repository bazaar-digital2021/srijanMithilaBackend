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
      title: "My API Documentation",
      version: "1.0.0",
      description: "Auto-generated Swagger docs for all APIs",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ["./routes/*.js", "./app.js"], // update if routes are in another folder
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Security HTTP headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);

// Parse request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// MongoDB Injection Protection
app.use(
  mongoSanitize({
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized ${key}:`, req[key]);
    },
    replaceWith: "_",
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// Root Route with welcome message
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

// Error Handler
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

// DB + Server Boot
const startServer = async () => {
  try {
    await connectionToMongoDB();
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();

export default app;
