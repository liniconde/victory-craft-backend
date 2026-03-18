import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/auth";

export type AuthUser = {
  id: string;
  email?: string;
  role?: string;
};

const normalizeUserFromToken = (decoded: any): AuthUser | null => {
  const id = decoded?.id || decoded?._id || decoded?.userId || decoded?.sub;
  if (!id) return null;
  return {
    id: String(id),
    email: decoded?.email,
    role: decoded?.role,
  };
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      res.status(401).json({ message: "Missing bearer token", code: "unauthorized" });
      return;
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const normalizedUser = normalizeUserFromToken(decoded);
    if (!normalizedUser) {
      res.status(401).json({ message: "Invalid token payload", code: "unauthorized" });
      return;
    }

    (req as any).user = normalizedUser;
    next();
  } catch (_error) {
    res.status(401).json({ message: "Invalid token", code: "unauthorized" });
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const normalizedUser = normalizeUserFromToken(decoded);
    if (normalizedUser) {
      (req as any).user = normalizedUser;
    }
  } catch (_error) {
    // Ignore optional auth errors to keep endpoint publicly readable.
  }
  next();
};
