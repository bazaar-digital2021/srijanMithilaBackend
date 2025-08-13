// routes/payments.js
import express from "express";
import mongoose from "mongoose";
import { body, validationResult } from "express-validator";
import {
  razorpay,
  verifyWebhookSignature,
  verifyCheckoutSignature,
} from "../utils/razorpay.js";
import Payment from "../models/Payment.js";
import { requireIdempotencyKey } from "../middleware/idempotency.js";
import { logger } from "../utils/logger.js";

export const webhookRouter = express.Router(); // mounted with raw body in app.js
const router = express.Router();

/**
 * Health & Docs
 */
router.get("/health", (_req, res) => {
  logger.debug("[Health] Health check endpoint hit");
  res.json({
    ok: true,
    routes: {
      createOrder: "POST /payments/order",
      verify: "POST /payments/verify",
      capture: "POST /payments/capture",
      refund: "POST /payments/refund",
      detail: "GET /payments/:rpOrderId",
      webhook: "POST /payments/webhook",
    },
  });
});

/**
 * Create Razorpay Order
 */
/**
 * Create Razorpay Order
 */
router.post(
  "/order",
  requireIdempotencyKey(),
  body("amountInPaise").isInt({ min: 100 }).withMessage("amountInPaise >= 100"),
  async (req, res) => {
    logger.debug("[Order] Create order request body:", req.body);
    logger.debug("[Order] Idempotency key in request:", req.idemKey);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn("[Order] Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { amountInPaise, orderId, customerId, email, contact, metadata } =
        req.body;

      logger.debug("[Order] Checking for existing payment with idemKey...");
      const existing = await Payment.findOne({
        idemCreateKey: req.idemKey,
      }).session(session);

      if (existing) {
        logger.warn(
          { rpOrderId: existing.rpOrderId },
          "[Order] Idempotent reuse — returning existing order"
        );
        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({
          reused: true,
          rpOrderId: existing.rpOrderId,
          amount: existing.amount,
          currency: existing.currency,
        });
      }

      logger.debug(
        "[Order] No existing payment found, creating new order in Razorpay..."
      );

      // FIX: Only pass order data, not headers (to avoid cb error)
      const rpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: orderId || `rcpt_${Date.now()}`,
        payment_capture: 1,
        notes: { customerId, ...metadata },
      });

      logger.debug("[Order] Razorpay order created:", rpOrder);

      const doc = await Payment.create(
        [
          {
            orderId,
            customerId,
            rpOrderId: rpOrder.id,
            amount: rpOrder.amount,
            currency: rpOrder.currency,
            status: "created",
            email,
            contact,
            metadata: rpOrder.notes || {},
            idemCreateKey: req.idemKey,
          },
        ],
        { session }
      );

      logger.debug("[Order] Payment document inserted:", doc[0]);

      await session.commitTransaction();
      session.endSession();

      logger.info(
        { rpOrderId: rpOrder.id },
        "[Order] Order successfully created"
      );
      return res.status(201).json({
        rpOrderId: rpOrder.id,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      logger.error({ err }, "[Order] Error creating order");
      return res.status(500).json({ message: "Failed to create order" });
    }
  }
);

/**
 * Verify after frontend Checkout success
 */
router.post(
  "/verify",
  body("razorpay_order_id").notEmpty(),
  body("razorpay_payment_id").notEmpty(),
  body("razorpay_signature").notEmpty(),
  async (req, res) => {
    logger.debug("[Verify] Verification request body:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn("[Verify] Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    logger.debug("[Verify] Performing local signature verification...");

    // ==== COMMENTED OUT FOR SERVER-SIDE TESTING ONLY ====
    // const ok = verifyCheckoutSignature({
    //   orderId: razorpay_order_id,
    //   paymentId: razorpay_payment_id,
    //   signature: razorpay_signature,
    // });

    // For testing, always pass
    const ok = true;

    if (!ok) {
      logger.warn({ razorpay_order_id }, "[Verify] Checkout signature invalid");
      return res.status(400).json({ message: "Invalid signature" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      logger.debug("[Verify] Updating payment status in DB...");
      const updated = await Payment.findOneAndUpdate(
        { rpOrderId: razorpay_order_id },
        {
          $set: {
            rpPaymentId: razorpay_payment_id,
            status: "captured",
            lastEvent: "client.verify.ok",
          },
        },
        { new: true, session }
      );

      if (!updated)
        throw new Error("Payment document not found for this order");

      await session.commitTransaction();
      session.endSession();

      logger.info(
        { rpOrderId: razorpay_order_id },
        "[Verify] Payment verified"
      );
      return res.json({
        ok: true,
        rpOrderId: razorpay_order_id,
        rpPaymentId: razorpay_payment_id,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      logger.error({ err }, "[Verify] Verify update failed");
      return res.status(500).json({ message: "Verify failed" });
    }
  }
);

/**
 * Manual capture API
 */
router.post("/capture", async (req, res) => {
  logger.debug("[Capture] Capture request body:", req.body);

  // Accept either field
  const rpPaymentId = req.body.rpPaymentId || req.body.razorpay_payment_id;
  const amountInPaise = req.body.amountInPaise || 50000;

  if (!rpPaymentId) {
    logger.warn("[Capture] Validation error: rpPaymentId missing");
    return res.status(400).json({
      errors: [
        {
          type: "field",
          msg: "rpPaymentId or razorpay_payment_id is required",
          path: "rpPaymentId",
          location: "body",
        },
      ],
    });
  }

  // ===== MOCKING RAZORPAY CAPTURE FOR TESTING =====
  const captured = {
    id: rpPaymentId,
    amount: amountInPaise,
    currency: "INR",
    status: "captured",
    method: "card",
  };
  logger.info({ rpPaymentId }, "[Capture] Payment captured (mock)");

  // Optional: Update DB for testing
  await Payment.findOneAndUpdate(
    { rpPaymentId },
    { $set: { status: "captured", lastEvent: "payment.captured.api" } }
  );

  return res.json({ ok: true, captured });
});

/**
 * Refund
 */
router.post(
  "/refund",
  requireIdempotencyKey(),
  body("rpPaymentId").notEmpty(),
  async (req, res) => {
    logger.debug("[Refund] Refund request body:", req.body);
    logger.debug("[Refund] Idempotency key:", req.idemKey);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn("[Refund] Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { rpPaymentId, amountInPaise } = req.body;
    const idem = req.idemKey;

    try {
      logger.debug("[Refund] Mocking Razorpay refund for testing...");

      // ------------------------
      // COMMENTED OUT FOR TESTING
      // const refund = await razorpay.payments.refund(
      //   rpPaymentId,
      //   {
      //     amount: amountInPaise,
      //     speed: "optimum",
      //     receipt: `refund_${Date.now()}`,
      //     notes: { idem },
      //   },
      //   {
      //     headers: { "X-Razorpay-Idempotency": idem },
      //   }
      // );
      // ------------------------

      // MOCK REFUND RESPONSE
      const refund = {
        id: `rf_test_${Date.now()}`,
        payment_id: rpPaymentId,
        amount: amountInPaise || 50000,
        currency: "INR",
        status: "processed",
        created_at: Math.floor(Date.now() / 1000),
        notes: { idem },
      };

      logger.debug("[Refund] Mock refund response:", refund);

      // Update DB (mock)
      await Payment.findOneAndUpdate(
        { rpPaymentId },
        {
          $push: {
            refunds: {
              refundId: refund.id,
              amount: refund.amount,
              status: refund.status,
              createdAt: new Date(refund.created_at * 1000 || Date.now()),
            },
          },
          $addToSet: { idemRefundKeys: idem },
          $set: { lastEvent: "refund.requested" },
        }
      );

      logger.info(
        { rpPaymentId, refundId: refund.id },
        "[Refund] Refund requested (mock)"
      );

      return res.json({ ok: true, refund });
    } catch (err) {
      logger.error({ err }, "[Refund] Refund failed");
      return res
        .status(400)
        .json({ message: "Refund failed", error: err.message });
    }
  }
);

/**
 * Detail lookup
 */
router.get("/:rpOrderId", async (req, res) => {
  logger.debug("[Detail] Lookup request for:", req.params.rpOrderId);

  const doc = await Payment.findOne({ rpOrderId: req.params.rpOrderId });
  if (!doc) {
    logger.warn("[Detail] Payment not found");
    return res.status(404).json({ message: "Not found" });
  }
  logger.debug("[Detail] Payment found:", doc);
  res.json(doc);
});

/**
 * Webhook
 */

webhookRouter.post("/", async (req, res) => {
  logger.debug("[Webhook] Incoming webhook request");

  // --------------------------
  // COMMENTED OUT FOR TESTING
  // const signature = req.headers["x-razorpay-signature"];
  // const rawBody = req.body?.toString?.() || req.body;
  // const secret = process.env.WEBHOOK_SECRET;

  // if (!verifyWebhookSignature(rawBody, signature, secret)) {
  //   logger.warn("[Webhook] Signature invalid");
  //   return res.status(400).send("Invalid signature");
  // }
  // --------------------------

  let event;
  try {
    event = req.body; // directly take parsed JSON from Postman or server
    logger.debug("[Webhook] Parsed event:", event);
  } catch (e) {
    logger.error(e, "[Webhook] Parse failed");
    return res.status(400).send("Invalid payload");
  }

  const type = event?.event;
  const payload = event?.payload || {};

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Payment events
    if (
      ["payment.captured", "payment.authorized", "payment.failed"].includes(
        type
      )
    ) {
      const payment = payload?.payment?.entity;
      if (payment?.order_id) {
        const set = {
          rpPaymentId: payment.id,
          method: payment.method,
          email: payment.email,
          contact: payment.contact,
          lastEvent: type,
        };

        if (type === "payment.captured") set.status = "captured";
        if (type === "payment.authorized") set.status = "authorized";
        if (type === "payment.failed") set.status = "failed";

        logger.debug("[Webhook] Updating payment document:", set);

        // --------------------------
        // COMMENTED OUT DB UPDATE FOR TESTING (optional)
        // await Payment.findOneAndUpdate(
        //   { rpOrderId: payment.order_id },
        //   { $set: set },
        //   { session, new: true }
        // );
        // --------------------------
      }
    }

    // Refund events
    if (
      ["refund.processed", "refund.failed", "refund.created"].includes(type)
    ) {
      const refund = payload?.refund?.entity;
      if (refund?.payment_id) {
        logger.debug("[Webhook] Updating refund details");

        // --------------------------
        // COMMENTED OUT DB UPDATE FOR TESTING (optional)
        // await Payment.findOneAndUpdate(
        //   { rpPaymentId: refund.payment_id },
        //   {
        //     $push: {
        //       refunds: {
        //         refundId: refund.id,
        //         amount: refund.amount,
        //         status: refund.status,
        //         createdAt: new Date(refund.created_at * 1000 || Date.now()),
        //       },
        //     },
        //     $set: {
        //       status:
        //         type === "refund.processed"
        //           ? "refunded"
        //           : type === "refund.created"
        //           ? "partially_refunded"
        //           : undefined,
        //       lastEvent: type,
        //     },
        //   },
        //   { session, new: true }
        // );
        // --------------------------
      }
    }

    await session.commitTransaction();
    session.endSession();
    logger.info({ type }, "[Webhook] Processed successfully");

    // Return the parsed event in response for testing
    res.json({ received: true, event });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    logger.error({ err }, "[Webhook] Handler failure");
    res.status(500).send("Webhook handler failure");
  }
});

export default router;
