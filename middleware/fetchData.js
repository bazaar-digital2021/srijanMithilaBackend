import jwt from "jsonwebtoken";

// Always use env variables for secrets
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

const fetchData = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return res.status(401).json({ error: "Token missing after Bearer prefix." });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);

    // Attach user ID to request
    req.user = decoded.userId;

    next();
  } catch (error) {
    console.error("Auth error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Access token expired. Please log in again." });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token. Please log in again." });
    }

    return res.status(500).json({ error: "Internal server error." });
  }
};

export default fetchData;
