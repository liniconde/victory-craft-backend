"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const videoController_1 = require("../controllers/videoController");
const aiAnalysisController_1 = require("../controllers/aiAnalysisController");
const analysisJobController_1 = require("../controllers/analysisJobController");
const videoAnalysisRecordController_1 = require("../controllers/videoAnalysisRecordController");
const router = express_1.default.Router();
// 📌 Endpoint para crear un nuevo video
router.post("/", videoController_1.handleCreateVideo);
router.post("/library", videoController_1.handleCreateLibraryVideo);
router.get("/library", videoController_1.handleGetLibraryVideos);
router.put("/:id", videoController_1.handleUpdateVideo);
router.post("/upload", videoController_1.handleUploadVideo);
router.post("/:id/analyzeVideo", analysisJobController_1.handleCreateAnalyzeVideoJob);
router.get("/:id/analyzeVideo/:jobId/status", analysisJobController_1.handleGetAnalyzeVideoJobStatus);
router.get("/:id/analysis-results", videoAnalysisRecordController_1.handleListVideoAnalysisRecords);
router.post("/:videoId/analyze", aiAnalysisController_1.analyzeVideoController);
exports.default = router;
//# sourceMappingURL=videoRoutes.js.map