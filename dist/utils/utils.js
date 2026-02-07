"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDevMode = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const isDevMode = () => process.env.DEV_MODE === "true";
exports.isDevMode = isDevMode;
//# sourceMappingURL=utils.js.map