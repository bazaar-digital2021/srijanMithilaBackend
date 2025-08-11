// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import helmet from "helmet";
// import cookieParser from "cookie-parser";
// import rateLimit from "express-rate-limit";
// import mongoSanitize from "express-mongo-sanitize";
// import connectionToMongoDB from "./config/database.js";
// import swaggerJsdoc from "swagger-jsdoc";
// import swaggerUi from "swagger-ui-express";
// import authRoutes from "./routes/auth.js";

// // Load environment variables
// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Swagger setup
// const swaggerOptions = {
//   definition: {
//     openapi: "3.0.0",
//     info: {
//       title: "SrijanMithila API",
//       version: "1.0.0",
//       description: "Auto-generated Swagger docs",
//     },
//     servers: [
//       {
//         // url: `https://srijanmithilabackend.onrender.com`,
//         url: `http://localhost:${PORT}`,
//       },
//     ],
//   },
//   apis: ["./routes/*.js", "./app.js"],
// };

// const swaggerSpec = swaggerJsdoc(swaggerOptions);
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// // Security middleware
// app.use(helmet());

// // CORS configuration
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || "*",
//     credentials: true,
//   })
// );

// // Parse JSON and URL-encoded data
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Cookie parser
// app.use(cookieParser());

// // Manual MongoDB sanitization (Safe for Express 4+)
// app.use((req, res, next) => {
//   if (req.body) mongoSanitize.sanitize(req.body);
//   if (req.query) mongoSanitize.sanitize(req.query);
//   if (req.params) mongoSanitize.sanitize(req.params);
//   next();
// });

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: "Too many requests, please try again later.",
// });
// app.use(limiter);

// // Root Route
// app.get("/", (req, res) => {
//   res.status(200).json({
//     message: "Welcome to the SrijanMithila API Server!",
//     docs: "/api-docs",
//     status: "Running",
//     env: process.env.NODE_ENV || "development",
//   });
// });

// app.use("/auth", authRoutes);

// /**
//  * @swagger
//  * /:
//  *   get:
//  *     summary: Welcome route
//  *     description: Returns a welcome message with link to docs.
//  *     responses:
//  *       200:
//  *         description: Successful response with welcome message
//  */

// // 404 Handler
// app.use((req, res) => {
//   res.status(404).json({ message: "Route not found" });
// });

// // Global Error Handler
// app.use((err, req, res, next) => {
//   console.error("Unhandled Error:", err.stack);
//   res.status(500).json({
//     message: "Server Error",
//     error:
//       process.env.NODE_ENV === "development"
//         ? err.message
//         : "Internal server error",
//   });
// });

// // Start server and connect DB
// const startServer = async () => {
//   try {
//     await connectionToMongoDB();
//     app.listen(PORT, () => {
//       console.log(
//         // `Server running at https://srijanmithilabackend.onrender.com`
//         `Server running at http://localhost:${PORT}`
//       );
//       console.log(
//         // `Swagger docs at https://srijanmithilabackend.onrender.com/api-docs`
//         `Swagger docs at http://localhost:${PORT}/api-docs`
//       );
//     });
//   } catch (error) {
//     console.error("Server failed to start:", error.message);
//     process.exit(1);
//   }
// };

// startServer();

// export default app;

// // import express from "express";
// // import dotenv from "dotenv";
// // import cors from "cors";
// // import helmet from "helmet";
// // import cookieParser from "cookie-parser";
// // import rateLimit from "express-rate-limit";
// // import mongoSanitize from "express-mongo-sanitize";
// // import connectionToMongoDB from "./config/database.js";
// // import swaggerJsdoc from "swagger-jsdoc";
// // import swaggerUi from "swagger-ui-express";
// // import authRoutes from "./routes/auth.js";

// // // Load environment variables
// // dotenv.config();

// // const app = express();
// // const PORT = process.env.PORT || 5000;

// // // Swagger setup
// // const swaggerOptions = {
// //   definition: {
// //     openapi: "3.0.0",
// //     info: {
// //       title: "SrijanMithila API",
// //       version: "1.0.0",
// //       description: "Auto-generated Swagger docs",
// //     },
// //     servers: [
// //       {
// //         // Use HTTP for local dev unless you have SSL certs
// //         url: `http://localhost:${PORT}`,
// //       },
// //     ],
// //   },
// //   apis: ["./routes/*.js", "./app.js"],
// // };

// // const swaggerSpec = swaggerJsdoc(swaggerOptions);
// // app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// // // Security middleware
// // app.use(helmet());

// // // CORS configuration
// // app.use(
// //   cors({
// //     origin: process.env.CLIENT_URL || "*",
// //     credentials: true,
// //   })
// // );

// // // Parse JSON and URL-encoded data
// // app.use(express.json());
// // app.use(express.urlencoded({ extended: true }));

// // // Cookie parser
// // app.use(cookieParser());

// // // MongoDB sanitization middleware (recommended usage)
// // app.use(mongoSanitize());

// // // Rate limiting
// // const limiter = rateLimit({
// //   windowMs: 15 * 60 * 1000, // 15 minutes
// //   max: 100,
// //   standardHeaders: true,
// //   legacyHeaders: false,
// //   message: "Too many requests, please try again later.",
// // });
// // app.use(limiter);

// // // Root Route
// // app.get("/", (req, res) => {
// //   res.status(200).json({
// //     message: "Welcome to the SrijanMithila API Server!",
// //     docs: "/api-docs",
// //     status: "Running",
// //     env: process.env.NODE_ENV || "development",
// //   });
// // });

// // app.use("/auth", authRoutes);

// // /**
// //  * @swagger
// //  * /:
// //  *   get:
// //  *     summary: Welcome route
// //  *     description: Returns a welcome message with link to docs.
// //  *     responses:
// //  *       200:
// //  *         description: Successful response with welcome message
// //  */

// // // 404 Handler
// // app.use((req, res) => {
// //   res.status(404).json({ message: "Route not found" });
// // });

// // // Global Error Handler
// // app.use((err, req, res, next) => {
// //   console.error("Unhandled Error:", err.stack);
// //   res.status(500).json({
// //     message: "Server Error",
// //     error:
// //       process.env.NODE_ENV === "development"
// //         ? err.message
// //         : "Internal server error",
// //   });
// // });

// // // Start server and connect DB
// // const startServer = async () => {
// //   try {
// //     await connectionToMongoDB();
// //     app.listen(PORT, () => {
// //       console.log(`Server running at http://localhost:${PORT}`);
// //       console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
// //     });
// //   } catch (error) {
// //     console.error("Server failed to start:", error.message);
// //     process.exit(1);
// //   }
// // };

// // startServer();

// // export default app;

// app.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import connectionToMongoDB from "./config/database.js";
import authRoutes from "./routes/auth.js";
import authGoogleRoutes from "./routes/authGoogle.js";
import { GoogleAuth } from "google-auth-library";

// Load environment variables
dotenv.config();
console.log("JWT_ACCESS_SECRET env:", process.env.JWT_ACCESS_SECRET);
console.log("JWT_ACCESS_SECRET length:", process.env.JWT_ACCESS_SECRET?.length);

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * IMPORTANT: Required environment variables check
 * Exit early with a clear message if required secrets are missing.
 */
const requiredEnvs = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "MONGO_URI"];
const missing = requiredEnvs.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(
    `Missing required env variables: ${missing.join(
      ", "
    )}\nPlease add them to your .env file (e.g. ${requiredEnvs.join(
      ", "
    )}) and restart.`
  );
  process.exit(1);
}

/**
 * Swagger / OpenAPI configuration
 *
 * - components.schemas contains request/response models so the UI shows all properties.
 * - securitySchemes defines Bearer auth so you can authorize in Swagger UI.
 * - apis points to route files; JSDoc comments inside those files will be picked up automatically.
 */
const swaggerOptions = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "SrijanMithila API",
      version: "1.0.0",
      description:
        "SrijanMithila backend API docs — signup, login, refresh token, get current user, etc.",
      contact: {
        name: "SrijanMithila",
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        SignupRequest: {
          type: "object",
          required: ["fullName", "email", "password"],
          properties: {
            fullName: { type: "string", example: "John Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              example: "Test@1234",
              description:
                "Password (min 8 chars, at least 1 uppercase, lowercase, number and special char)",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: { type: "string", example: "Test@1234" },
          },
        },
        RefreshTokenRequest: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "User registered successfully",
            },
            accessToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
            },
            refreshToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
            },
            user: {
              type: "object",
              properties: {
                id: { type: "string", example: "64d8a9c8e1f1a2b3c4d5e6f7" },
                fullName: { type: "string", example: "John Doe" },
                email: { type: "string", example: "john@example.com" },
              },
            },
          },
        },
        MeResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "User data fetched successfully",
            },
            accessToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
            },
            refreshToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
            },
            user: {
              type: "object",
              properties: {
                id: { type: "string", example: "64d8a9c8e1f1a2b3c4d5e6f7" },
                fullName: { type: "string", example: "John Doe" },
                email: { type: "string", example: "john@example.com" },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Invalid credentials" },
            errors: { type: "array", items: { type: "object" } },
          },
        },
      },
    },
    tags: [
      {
        name: "Auth",
        description:
          "Authentication endpoints (signup, login, refresh token, me)",
      },
    ],
    // optional explicit paths to ensure examples show even if routes lack JSDoc
    paths: {
      "/auth/signup": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SignupRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "Created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthResponse" },
                },
              },
            },
            400: {
              description: "Email already registered",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            422: {
              description: "Validation errors",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            500: {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login with email and password",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "OK",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthResponse" },
                },
              },
            },
            401: {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            422: {
              description: "Validation errors",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/auth/refresh-token": {
        post: {
          tags: ["Auth"],
          summary: "Refresh access token using refresh token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      accessToken: { type: "string" },
                      refreshToken: { type: "string" },
                    },
                  },
                },
              },
            },
            401: { description: "No refresh token provided" },
            403: { description: "Invalid or expired refresh token" },
          },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get currently logged-in user's data",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "OK",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/MeResponse" },
                },
              },
            },
            401: { description: "Unauthorized" },
            404: { description: "User not found" },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { explorer: true })
);

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

// mongo-sanitize: use safe replaceWith option so we don't try to overwrite read-only request getters
// app.use(
//   mongoSanitize({
//     replaceWith: "_",
//   })
// );
// Manual MongoDB sanitization (Safe for Express 4+)
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

// Mount your auth routes exactly as before
app.use("/auth", authRoutes);

app.use("/auth/google", GoogleAuth);

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
    await connectionToMongoDB(); // expects your config/database.js to read process.env.MONGO_URI
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
