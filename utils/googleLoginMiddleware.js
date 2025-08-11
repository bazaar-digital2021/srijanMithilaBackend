import jwt from "jsonwebtoken";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRES = "15m"; // adjust as needed
const REFRESH_TOKEN_EXPIRES = "7d"; // adjust as needed

export const signAccessToken = (userId) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { userId },
      JWT_ACCESS_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES },
      (err, token) => {
        if (err) reject(err);
        else resolve(token);
      }
    );
  });
};

export const signRefreshToken = (userId) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { userId },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES },
      (err, token) => {
        if (err) reject(err);
        else resolve(token);
      }
    );
  });
};
