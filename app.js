// app.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import connectionToMongoDB from "./config/database.js";
import authRoutes from "./routes/auth.js";
import authGoogleRoutes from "./routes/authGoogle.js";
import swaggerRouter from "./config/swagger.js";
import productRoutes from "./routes/products.js";
import paymentsRouter, { webhookRouter } from "./routes/payment.js";
import { logger } from "./utils/logger.js";
import { requireIdempotencyKey } from "./middleware/idempotency.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ---- Environment Variables Check ----
const requiredEnvs = [
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "MONGO_URI",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "IDEM_KEY_SECRET",
];
const missing = requiredEnvs.filter((k) => !process.env[k]);
if (missing.length > 0) {
  logger.error(
    `Missing required env variables: ${missing.join(
      ", "
    )}\nPlease add them to your .env file and restart.`
  );
  process.exit(1);
}

// ---- Security Middlewares ----
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);

// ---- Razorpay Webhook Raw Body Parsing ----
app.use(
  "/payments/webhooks",
  express.raw({ type: "*/*", limit: "1mb" }),
  webhookRouter
);

// ---- JSON Body Parsing ----
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ---- Cookie Parsing ----
app.use(cookieParser());

// ---- Mongo Sanitize ----
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.query) mongoSanitize.sanitize(req.query);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

// ---- Rate Limiting ----
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// ---- Apply Idempotency-Key Middleware Globally (except webhooks) ----
app.use((req, res, next) => {
  if (req.path.startsWith("/payments/webhooks")) {
    return next(); // Skip for webhooks
  }
  requireIdempotencyKey("Idempotency-Key")(req, res, next);
});

// ---- Root Route ----
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the SrijanMithila API Server!",
    docs: "/api-docs",
    status: "Running",
    env: process.env.NODE_ENV || "development",
    // idempotencyKey: req.idemKey,
    generatedKey: req.generatedIdemKey || false,
  });
});

// ---- Debugging for Product Routes ----
app.use("/product", (req, res, next) => {
  logger.debug(`[PRODUCT ROUTE] ${req.method} request to ${req.originalUrl}`);
  logger.debug("Headers:", req.headers);
  logger.debug("Body:", req.body);
  logger.debug("Idempotency Key:", req.idemKey);
  next();
});

// ---- Mount Routes ----
app.use("/auth", authRoutes);
app.use("/auth/google", authGoogleRoutes);
app.use("/product", productRoutes);
app.use("/payments", paymentsRouter);
app.use("/api-docs", swaggerRouter);

// ---- 404 Handler ----
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ---- Error Handler ----
app.use((err, req, res, next) => {
  logger.error("Unhandled Error:", err.stack);
  res.status(500).json({
    message: "Server Error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// ---- Start Server ----
const startServer = async () => {
  try {
    await connectionToMongoDB();
    app.listen(PORT, () => {
      logger.info(`Server running at http://localhost:${PORT}`);
      logger.info(`Swagger docs at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();

export default app;
