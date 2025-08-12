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
        "SrijanMithila backend API docs — signup, login, refresh token, get current user, Google login, product CRUD, etc.",
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
        GoogleLoginRequest: {
          type: "object",
          required: ["idToken"],
          properties: {
            idToken: {
              type: "string",
              example: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2MD...",
              description: "Google ID token from client",
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

        // Product Schemas
        Product: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64d9a9c9e1f1a2b3c4d5e6f8" },
            name: { type: "string", example: "Example Product" },
            description: {
              type: "string",
              example: "This is a sample product description.",
            },
            price: { type: "number", example: 199.99 },
            category: { type: "string", example: "Electronics" },
            brand: { type: "string", example: "Acme" },
            stock: { type: "integer", example: 50 },
            images: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  public_id: { type: "string", example: "image123" },
                  url: {
                    type: "string",
                    example: "https://example.com/image.jpg",
                  },
                },
              },
            },
            rating: { type: "number", example: 4.5 },
            numReviews: { type: "integer", example: 10 },
            isFeatured: { type: "boolean", example: true },
            createdBy: {
              type: "object",
              properties: {
                _id: { type: "string", example: "64d8a9c8e1f1a2b3c4d5e6f7" },
                fullName: { type: "string", example: "Admin User" },
                email: { type: "string", example: "admin@example.com" },
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2024-08-12T10:00:00Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2024-08-12T12:00:00Z",
            },
          },
        },
        ProductCreateRequest: {
          type: "object",
          required: ["name", "description", "price", "category", "stock"],
          properties: {
            name: { type: "string", example: "Example Product" },
            description: {
              type: "string",
              example: "This is a sample product description.",
            },
            price: { type: "number", example: 199.99 },
            category: { type: "string", example: "Electronics" },
            brand: { type: "string", example: "Acme" },
            stock: { type: "integer", example: 50 },
            images: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  public_id: { type: "string", example: "image123" },
                  url: {
                    type: "string",
                    example: "https://example.com/image.jpg",
                  },
                },
              },
            },
            isFeatured: { type: "boolean", example: true },
          },
        },
        ProductUpdateRequest: {
          type: "object",
          properties: {
            name: { type: "string", example: "Updated Product Name" },
            description: { type: "string", example: "Updated description" },
            price: { type: "number", example: 150.0 },
            category: { type: "string", example: "Updated Category" },
            brand: { type: "string", example: "Updated Brand" },
            stock: { type: "integer", example: 20 },
            images: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  public_id: { type: "string", example: "image456" },
                  url: {
                    type: "string",
                    example: "https://example.com/updatedimage.jpg",
                  },
                },
              },
            },
            isFeatured: { type: "boolean", example: false },
          },
        },
      },
    },
    tags: [
      {
        name: "Auth",
        description:
          "Authentication endpoints (signup, login, refresh token, me, Google login)",
      },
      {
        name: "Product",
        description:
          "Product management endpoints (create, read, update, delete)",
      },
    ],
    paths: {
      // Auth routes (preserved your existing ones)
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
    },
  },
  apis: ["./routes/*.js"], // your JSDoc route files if any
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default router;
