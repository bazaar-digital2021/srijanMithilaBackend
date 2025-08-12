
# SrijanMithila Backend API

This repository contains the backend API for the **SrijanMithila** project.  
It provides endpoints for user authentication (signup, login, Google login, token refresh), and product management (CRUD operations), secured with JWT authentication and role-based access control.

---

## Features

- User Authentication
  - Signup, Login, Logout
  - JWT Access & Refresh Tokens
  - Google OAuth Login
  - Get current logged-in user (`/auth/me`)
- Product Management
  - Create, Read, Update, Delete (CRUD) products
  - Role-based access control: only **admin** users can create, update, or delete products
  - Public access to view products
- Comprehensive API documentation via **Swagger UI**

---

## Tech Stack

- Node.js & Express.js
- MongoDB with Mongoose ODM
- JWT for Authentication & Authorization
- Swagger/OpenAPI for API documentation
- Validation using `express-validator`

---

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/srijanMithilaBackend.git
   cd srijanMithilaBackend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_ACCESS_SECRET=your_jwt_access_secret
   JWT_REFRESH_SECRET=your_jwt_refresh_secret
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

---

## API Documentation

Once the server is running, access the API docs at:

```
https://srijanmithilabackend.onrender.com/api-docs
```

This interactive Swagger UI provides detailed information about all available endpoints, request/response formats, and allows you to test API calls.

---

## API Endpoints Overview

### Authentication

| Endpoint           | Method | Description                         | Auth Required |
| ------------------ | ------ | --------------------------------- | ------------- |
| `/auth/signup`     | POST   | Register a new user                | No            |
| `/auth/login`      | POST   | Login with email and password     | No            |
| `/auth/google`     | POST   | Login with Google OAuth token     | No            |
| `/auth/refresh-token` | POST | Refresh JWT access token           | No            |
| `/auth/me`         | GET    | Get logged-in user details        | Yes           |

### Products

| Endpoint           | Method | Description                         | Auth Required | Admin Only |
| ------------------ | ------ | --------------------------------- | ------------- | ---------- |
| `/product`         | GET    | Get all products                   | No            | No         |
| `/product/:id`     | GET    | Get product details by ID          | No            | No         |
| `/product/create`  | POST   | Create a new product               | Yes           | Yes        |
| `/product/:id`     | PUT    | Update product by ID               | Yes           | Yes        |
| `/product/:id`     | DELETE | Delete product by ID               | Yes           | Yes        |

---

## Sample Request Payloads

### Signup

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "Test@1234"
}
```

### Login

```json
{
  "email": "john@example.com",
  "password": "Test@1234"
}
```

### Create Product (Admin only)

```json
{
  "name": "Example Product",
  "description": "This is a sample product description.",
  "price": 199.99,
  "category": "Electronics",
  "brand": "Acme",
  "stock": 50,
  "images": [
    {
      "public_id": "image123",
      "url": "https://example.com/image.jpg"
    }
  ],
  "isFeatured": true
}
```

---

## Contact

Created and maintained by **SrijanMithila Team**

---
