"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../config/auth");
const normalizeUserFromToken = (decoded) => {
    const id = (decoded === null || decoded === void 0 ? void 0 : decoded.id) || (decoded === null || decoded === void 0 ? void 0 : decoded._id) || (decoded === null || decoded === void 0 ? void 0 : decoded.userId) || (decoded === null || decoded === void 0 ? void 0 : decoded.sub);
    if (!id)
        return null;
    return {
        id: String(id),
        email: decoded === null || decoded === void 0 ? void 0 : decoded.email,
        role: decoded === null || decoded === void 0 ? void 0 : decoded.role,
    };
};
const requireAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";
        const [scheme, token] = authHeader.split(" ");
        if (scheme !== "Bearer" || !token) {
            res.status(401).json({ message: "Missing bearer token", code: "unauthorized" });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, (0, auth_1.getJwtSecret)());
        const normalizedUser = normalizeUserFromToken(decoded);
        if (!normalizedUser) {
            res.status(401).json({ message: "Invalid token payload", code: "unauthorized" });
            return;
        }
        req.user = normalizedUser;
        next();
    }
    catch (_error) {
        res.status(401).json({ message: "Invalid token", code: "unauthorized" });
    }
};
exports.requireAuth = requireAuth;
const optionalAuth = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization || "";
        const [scheme, token] = authHeader.split(" ");
        if (scheme !== "Bearer" || !token) {
            next();
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, (0, auth_1.getJwtSecret)());
        const normalizedUser = normalizeUserFromToken(decoded);
        if (normalizedUser) {
            req.user = normalizedUser;
        }
    }
    catch (_error) {
        // Ignore optional auth errors to keep endpoint publicly readable.
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=authMiddleware.js.map