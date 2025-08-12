// utils/jwt.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error("JWT secrets are not set in environment variables");
}

// Token expiry times
const ACCESS_TOKEN_EXPIRES = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRES = "7d"; // 7 days

/**
 * Sign an access token
 * @param {string} userId
 * @returns {Promise<string>}
 */
export const signAccessToken = (userId) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { userId },
      JWT_ACCESS_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES },
      (err, token) => {
        if (err) return reject(err);
        resolve(token);
      }
    );
  });
};

/**
 * Sign a refresh token
 * @param {string} userId
 * @returns {Promise<string>}
 */
export const signRefreshToken = (userId) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { userId },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES },
      (err, token) => {
        if (err) return reject(err);
        resolve(token);
      }
    );
  });
};

/**
 * Verify an access token
 * @param {string} token
 * @returns {Promise<object>}
 */
export const verifyAccessToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_ACCESS_SECRET, (err, payload) => {
      if (err) return reject(err);
      resolve(payload);
    });
  });
};

/**
 * Verify a refresh token
 * @param {string} token
 * @returns {Promise<object>}
 */
export const verifyRefreshToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_REFRESH_SECRET, (err, payload) => {
      if (err) return reject(err);
      resolve(payload);
    });
  });
};
