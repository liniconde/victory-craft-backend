"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const videoController_1 = require("../controllers/videoController");
const router = express_1.default.Router();
// 📌 Endpoint para crear un nuevo video
router.post("/", videoController_1.handleCreateVideo);
exports.default = router;
//# sourceMappingURL=videoRoutes.js.map