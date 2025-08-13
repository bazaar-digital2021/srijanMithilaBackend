# SrijanMithila Backend API

This repository contains the backend API for the **SrijanMithila** project.  
It provides endpoints for **user authentication**, **product management**, and **payment processing** with Razorpay, secured with JWT authentication and role-based access control.

---

## Features

### User Authentication

- Signup, Login, Logout
- JWT Access & Refresh Tokens
- Google OAuth Login
- Get current logged-in user (`/auth/me`)

### Product Management

- Create, Read, Update, Delete (CRUD) products
- Role-based access control: only **admin** users can create, update, or delete products
- Public access to view products

### Payment Management

- Razorpay integration for order creation, verification, capture, and refunds
- Webhook processing for payment and refund events
<!-- - Endpoints:
  - `POST /payments/order` – Create Razorpay order
  - `POST /payments/verify` – Verify payment signature after frontend checkout
  - `POST /payments/capture` – Capture payment manually
  - `POST /payments/refund` – Initiate refund
  - `GET /payments/:rpOrderId` – Get payment details
  - `POST /payments/webhook` – Process Razorpay webhooks -->

### Additional Features

- Comprehensive API documentation via **Swagger UI**
- Validation using `express-validator`
- Logging for debugging and monitoring

---

## Tech Stack

- Node.js & Express.js
- MongoDB with Mongoose ODM
- JWT for Authentication & Authorization
- Razorpay for Payments
- Swagger/OpenAPI for API documentation
- Validation using `express-validator`
- Idempotency for payment requests

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
   MONGO_URI=your_mongodb_uri
   PORT=your_port_number
   JWT_ACCESS_SECRET=your_jwt_access_token
   JWT_REFRESH_SECRET=your_jwt_refresh_token
   GOOGLE_CLIENT_ID=your_google_client_id
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   WEBHOOK_SECRET=your_webhook_secret
   IDEM_KEY_SECRET=your_idem_key_secret

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

## Contact

Created and maintained by **BazaarDigital Team**

---
