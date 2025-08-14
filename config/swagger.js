import express from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const router = express.Router();

const PORT = process.env.PORT || 5000;
const swaggerOptions = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "SrijanMithila API",
      version: "1.0.0",
      description:
        "SrijanMithila backend API docs — signup, login, refresh token, get current user, Google login, product CRUD, payment operations, etc.",
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
        // Auth Schemas
        SignupRequest: {
          type: "object",
          required: ["fullName", "email", "password", "mobile"],
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
                "Password (min 8 chars, uppercase, lowercase, number, special char)",
            },
            mobile: {
              type: "string",
              example: "8828382326",
              description: "10-digit mobile number, without +91 prefix",
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
            refreshToken: { type: "string", example: "eyJhbGciOi..." },
          },
        },
        GoogleLoginRequest: {
          type: "object",
          required: ["idToken"],
          properties: {
            idToken: {
              type: "string",
              example: "eyJhbGciOi...",
              description: "Google ID token",
            },
            mobile: {
              type: "string",
              example: "8828382326",
              description:
                "Required only for new users to register mobile for OTP login",
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
            accessToken: { type: "string", example: "eyJhbGciOi..." },
            refreshToken: { type: "string", example: "eyJhbGciOi..." },
            user: {
              type: "object",
              properties: {
                id: { type: "string", example: "64d8a9c8e1f1a2b3c4d5e6f7" },
                fullName: { type: "string", example: "John Doe" },
                email: { type: "string", example: "john@example.com" },
                mobile: { type: "string", example: "8828382326" }, // added mobile
              },
            },
          },
        },
        MeResponse: { $ref: "#/components/schemas/AuthResponse" },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Invalid credentials" },
            errors: { type: "array", items: { type: "object" } },
          },
        },

        // Payment Schemas
        PaymentOrderRequest: {
          type: "object",
          required: ["amount", "currency"],
          properties: {
            amount: { type: "number", example: 499 },
            currency: { type: "string", example: "INR" },
          },
        },
        PaymentOrderResponse: {
          type: "object",
          properties: {
            id: { type: "string", example: "order_123456789" },
            amount: { type: "number", example: 499 },
            currency: { type: "string", example: "INR" },
            status: { type: "string", example: "created" },
          },
        },
        PaymentVerifyRequest: {
          type: "object",
          required: ["orderId", "paymentId", "signature"],
          properties: {
            orderId: { type: "string", example: "order_123456789" },
            paymentId: { type: "string", example: "pay_123456789" },
            signature: { type: "string", example: "signature_hash" },
          },
        },
        PaymentVerifyResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            orderId: { type: "string", example: "order_123456789" },
            paymentId: { type: "string", example: "pay_123456789" },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Product", description: "Product management endpoints" },
      { name: "Payment", description: "Payment gateway endpoints" },
    ],
    paths: {
      // Auth routes (preserved your existing ones)
      // ===================== SIGNUP: SEND OTP =====================
      "/auth/signup/send-otp": {
        post: {
          tags: ["Auth"],
          summary: "Send OTP to mobile for signup",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["fullName", "email", "password", "mobile"],
                  properties: {
                    fullName: { type: "string", example: "John Doe" },
                    email: {
                      type: "string",
                      format: "email",
                      example: "john@example.com",
                    },
                    password: { type: "string", example: "Test@1234" },
                    mobile: {
                      type: "string",
                      example: "8828382326",
                      description: "10-digit mobile number (no +91 needed)",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "OTP sent successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example:
                          "OTP sent to mobile. Verify to complete signup.",
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Email or mobile already registered",
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
            429: {
              description: "Cooldown error - OTP already sent",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "Please wait 30s before requesting a new OTP",
                      },
                    },
                  },
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

      // ===================== SIGNUP: VERIFY OTP =====================
      "/auth/signup/verify-otp": {
        post: {
          tags: ["Auth"],
          summary: "Verify OTP for signup and create account",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["mobile", "otp"],
                  properties: {
                    mobile: { type: "string", example: "8828382326" },
                    otp: {
                      type: "string",
                      example: "638335",
                      description: "6-digit OTP sent to mobile",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Signup successful",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthResponse" },
                },
              },
            },
            400: {
              description: "Invalid or expired OTP",
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
            409: {
              description: "Email or mobile already in use",
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

      // ===================== LOGIN: SEND OTP =====================
      "/auth/login/send-otp": {
        post: {
          tags: ["Auth"],
          summary: "Send OTP to email/mobile for login",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["identifier"],
                  properties: {
                    identifier: {
                      type: "string",
                      example: "john@example.com",
                      description: "Email or 10-digit mobile number",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "OTP sent successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "OTP sent for login",
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: "User not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            429: {
              description: "Cooldown error - OTP already sent",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "Please wait 30s before requesting a new OTP",
                      },
                    },
                  },
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

      // ===================== LOGIN: VERIFY OTP =====================
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Verify OTP for login",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["identifier", "otp"],
                  properties: {
                    identifier: {
                      type: "string",
                      example: "john@example.com",
                      description: "Email or 10-digit mobile number",
                    },
                    otp: {
                      type: "string",
                      example: "638335",
                      description: "6-digit OTP sent to mobile",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthResponse" },
                },
              },
            },
            400: {
              description: "Invalid or expired OTP",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            404: {
              description: "User not found",
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
            429: {
              description: "Cooldown error - OTP already sent",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "Please wait 30s before requesting a new OTP",
                      },
                    },
                  },
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
      "/auth/google": {
        post: {
          tags: ["Auth"],
          summary: "Login using Google OAuth ID token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GoogleLoginRequest" },
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
              description: "Invalid Google token",
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

      // Product routes
      "/product": {
        get: {
          tags: ["Product"],
          summary: "Get all products",
          responses: {
            200: {
              description: "List of products",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      products: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Product" },
                      },
                    },
                  },
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
      "/product/{id}": {
        get: {
          tags: ["Product"],
          summary: "Get product by ID",
          parameters: [
            {
              name: "id",
              in: "path",
              description: "Product ID",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Product details",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Product" },
                },
              },
            },
            400: {
              description: "Invalid product ID",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            404: {
              description: "Product not found",
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
        put: {
          tags: ["Product"],
          summary: "Update product by ID (admin only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              description: "Product ID",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductUpdateRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated product details",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Product" },
                },
              },
            },
            400: {
              description: "Invalid product ID or validation errors",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            403: {
              description: "Access denied. Admins only.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            404: {
              description: "Product not found",
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
        delete: {
          tags: ["Product"],
          summary: "Delete product by ID (admin only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              description: "Product ID",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Product deleted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "Product deleted successfully",
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Invalid product ID",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            403: {
              description: "Access denied. Admins only.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            404: {
              description: "Product not found",
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
      //Payment Routes
      "/product/create": {
        post: {
          tags: ["Product"],
          summary: "Create a new product (admin only)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductCreateRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "Product created successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Product" },
                },
              },
            },
            400: {
              description: "Validation errors",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            403: {
              description: "Access denied. Admins only.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            409: {
              description: "Duplicate product name",
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
      "/payment/order": {
        post: {
          tags: ["Payment"],
          summary: "Create a payment order",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaymentOrderRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "Order created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PaymentOrderResponse" },
                },
              },
            },
            400: {
              description: "Invalid request",
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
      "/payment/verify": {
        post: {
          tags: ["Payment"],
          summary: "Verify payment after completion",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaymentVerifyRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Payment verified",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaymentVerifyResponse",
                  },
                },
              },
            },
            400: {
              description: "Invalid payment data",
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
      "/payment/{id}": {
        get: {
          tags: ["Payment"],
          summary: "Get payment/order details by ID",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Payment/Order ID",
            },
          ],
          responses: {
            200: {
              description: "Payment details",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PaymentOrderResponse" },
                },
              },
            },
            404: {
              description: "Payment not found",
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
      "/payments/health": {
        get: {
          tags: ["Payment"],
          summary: "Payment service health check",
          responses: {
            200: {
              description: "Service is healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean", example: true },
                      routes: {
                        type: "object",
                        example: {
                          createOrder: "POST /payments/order",
                          verify: "POST /payments/verify",
                          capture: "POST /payments/capture",
                          refund: "POST /payments/refund",
                          detail: "GET /payments/:rpOrderId",
                          webhook: "POST /payments/webhook",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/payments/capture": {
        post: {
          tags: ["Payment"],
          summary: "Manually capture a payment",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    rpPaymentId: { type: "string", example: "pay_123456789" },
                    amountInPaise: { type: "integer", example: 50000 },
                  },
                  required: ["rpPaymentId"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Payment captured successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean", example: true },
                      captured: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          amount: { type: "number" },
                          currency: { type: "string" },
                          status: { type: "string" },
                          method: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/payments/refund": {
        post: {
          tags: ["Payment"],
          summary: "Refund a payment",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    rpPaymentId: { type: "string", example: "pay_123456789" },
                    amountInPaise: { type: "integer", example: 50000 },
                  },
                  required: ["rpPaymentId"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Refund processed successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean", example: true },
                      refund: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          payment_id: { type: "string" },
                          amount: { type: "number" },
                          currency: { type: "string" },
                          status: { type: "string" },
                          created_at: { type: "integer" },
                          notes: { type: "object" },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/payments/webhook": {
        post: {
          tags: ["Payment"],
          summary: "Receive Razorpay webhook events",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  example: {
                    event: "payment.captured",
                    payload: {
                      payment: {
                        entity: {
                          id: "pay_123",
                          order_id: "order_123",
                          method: "card",
                          status: "captured",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Webhook received successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      received: { type: "boolean", example: true },
                      event: { type: "object" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Invalid payload",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            500: {
              description: "Webhook handler failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js"], // your JSDoc route files if any
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default router;
