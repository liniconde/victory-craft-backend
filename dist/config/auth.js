"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAppToken = exports.getJwtSecret = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getJwtSecret = () => process.env.JWT_SECRET || process.env.SECRET_KEY || "default_secret";
exports.getJwtSecret = getJwtSecret;
const signAppToken = (payload) => jsonwebtoken_1.default.sign(payload, (0, exports.getJwtSecret)(), { expiresIn: "7d" });
exports.signAppToken = signAppToken;
//# sourceMappingURL=auth.js.map