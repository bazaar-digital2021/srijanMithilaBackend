// middleware/idempotency.js
import crypto from "crypto";

/**
 * Generate an Idempotency Key
 * @param {string} userId - Optional user ID to add uniqueness
 * @returns {string} - Generated key
 */
function generateIdempotencyKey(userId = "anonymous") {
  console.log("[Idempotency] Generating new key...");

  const secretSalt = process.env.IDEM_KEY_SECRET || "supersecret_salt_here";
  console.log(
    "[Idempotency] Using secret salt:",
    secretSalt ? "(set)" : "(default)"
  );

  const randomBytes = crypto.randomBytes(8).toString("hex");
  console.log("[Idempotency] Random bytes:", randomBytes);

  const rawData = `${userId}:${Date.now()}:${randomBytes}`;
  console.log("[Idempotency] Raw data for hashing:", rawData);

  const hashedKey = crypto
    .createHmac("sha256", secretSalt)
    .update(rawData)
    .digest("hex");

  console.log("[Idempotency] Generated HMAC key:", hashedKey);
  return hashedKey;
}

/**
 * Middleware to require or generate an Idempotency Key
 * @param {string} headerName - The header name to check
 */
export const requireIdempotencyKey = (headerName = "Idempotency-Key") => {
  return (req, res, next) => {
    console.log(`\n[Idempotency] Checking header "${headerName}"...`);
    let key = req.header(headerName);

    if (!key) {
      console.log("[Idempotency] No key found in request headers.");
      const userId = req.user?.id || req.body?.userId || "anonymous";
      console.log("[Idempotency] Using user ID for key generation:", userId);

      key = generateIdempotencyKey(userId);
      req.generatedIdemKey = true;
      console.log(`[Idempotency] Auto-generated ${headerName}: ${key}`);
    } else {
      req.generatedIdemKey = false;
      console.log(`[Idempotency] Received ${headerName} from client: ${key}`);
    }

    req.idemKey = key;

    // Set the header in the response for transparency
    res.setHeader(headerName, key);
    console.log(`[Idempotency] ${headerName} set in response headers.`);

    next();
  };
};
