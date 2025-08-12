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
import productRoutes from "./routes/products.js"; // ensure path correct

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;

const requiredEnvs = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "MONGO_URI"];
const missing = requiredEnvs.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(
    `Missing required env variables: ${missing.join(
      ", "
    )}\nPlease add them to your .env file and restart.`
  );
  process.exit(1);
}

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.query) mongoSanitize.sanitize(req.query);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
});
app.use(limiter);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the SrijanMithila API Server!",
    docs: "/api-docs",
    status: "Running",
    env: process.env.NODE_ENV || "development",
  });
});

// --- Debugging middleware for all product routes ---
app.use("/product", (req, res, next) => {
  console.log(
    `[PRODUCT ROUTE] ${req.method} request to ${req.originalUrl} - Body:`,
    req.body
  );
  next();
});

// Mount routes
app.use("/auth", authRoutes);
app.use("/auth/google", authGoogleRoutes);
app.use("/product", productRoutes);
app.use("/api-docs", swaggerRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

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
