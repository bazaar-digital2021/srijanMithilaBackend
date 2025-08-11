import jwt from "jsonwebtoken";

const fetchData = (req, res, next) => {
  try {
    const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
    console.log("Middleware JWT_ACCESS_SECRET:", JWT_ACCESS_SECRET);
    if (!JWT_ACCESS_SECRET) {
      throw new Error("JWT_ACCESS_SECRET is not defined");
    }

    console.log("Starting fetchData middleware");

    const authHeader = req.header("Authorization");
    console.log("Authorization header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No Authorization header or does not start with Bearer");
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1].trim();
    console.log("Extracted token:", token);

    if (!token) {
      console.log("Token missing after Bearer prefix");
      return res
        .status(401)
        .json({ error: "Token missing after Bearer prefix." });
    }

    // Verify token
    console.log("Verifying token with secret:", JWT_ACCESS_SECRET);
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    console.log("Decoded token payload:", decoded);

    // Attach user ID to request
    req.user = decoded.userId;
    console.log("Attached user ID to request:", req.user);

    next();
    console.log("Middleware finished, called next()");
  } catch (error) {
    console.error("Auth error:", error.message);

    if (error.name === "TokenExpiredError") {
      console.log("TokenExpiredError caught");
      return res
        .status(401)
        .json({ error: "Access token expired. Please log in again." });
    }

    if (error.name === "JsonWebTokenError") {
      console.log("JsonWebTokenError caught");
      return res
        .status(401)
        .json({ error: "Invalid token. Please log in again." });
    }

    console.log("Unknown error caught, sending 500");
    return res.status(500).json({ error: "Internal server error." });
  }
};

export default fetchData;
