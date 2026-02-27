import jwt from "jsonwebtoken";

export const getJwtSecret = () =>
  process.env.JWT_SECRET || process.env.SECRET_KEY || "default_secret";

export const signAppToken = (payload: Record<string, any>) =>
  jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
