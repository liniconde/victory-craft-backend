"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const videoController_1 = require("../controllers/videoController");
const aiAnalysisController_1 = require("../controllers/aiAnalysisController");
const router = express_1.default.Router();
// 📌 Endpoint para crear un nuevo video
router.post("/", videoController_1.handleCreateVideo);
router.put("/:id", videoController_1.handleUpdateVideo);
router.post("/upload", videoController_1.handleUploadVideo);
router.post("/:videoId/analyze", aiAnalysisController_1.analyzeVideoController);
exports.default = router;
//# sourceMappingURL=videoRoutes.js.map