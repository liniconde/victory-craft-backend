"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const videoController_1 = require("../controllers/videoController");
const aiAnalysisController_1 = require("../controllers/aiAnalysisController");
const analysisJobController_1 = require("../controllers/analysisJobController");
const analysisArtifactController_1 = require("../controllers/analysisArtifactController");
const videoAnalysisRecordController_1 = require("../controllers/videoAnalysisRecordController");
const videoScoutingRoutes_1 = require("../recruiters-ms/presentation/videoScoutingRoutes");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
// 📌 Endpoint para crear un nuevo video
router.post("/", videoController_1.handleCreateVideo);
router.post("/library", authMiddleware_1.optionalAuth, videoController_1.handleCreateLibraryVideo);
router.get("/library", authMiddleware_1.optionalAuth, videoController_1.handleGetLibraryVideos);
router.get("/library/mine", authMiddleware_1.requireAuth, videoController_1.handleGetMyLibraryVideos);
(0, videoScoutingRoutes_1.registerRecruitersMsVideoRoutes)(router);
router.put("/:id", videoController_1.handleUpdateVideo);
router.delete("/:id", videoController_1.handleDeleteVideo);
router.post("/upload", videoController_1.handleUploadVideo);
router.post("/sign-upload", videoController_1.handleUploadVideo);
router.post("/:id/analyzeVideo", analysisJobController_1.handleCreateAnalyzeVideoJob);
router.post("/:id/analyzeAgent", analysisJobController_1.handleCreateAnalyzeAgentJob);
router.get("/:id/analyzeVideo/:jobId/status", analysisJobController_1.handleGetAnalyzeVideoJobStatus);
router.get("/:id/analysis-results", videoAnalysisRecordController_1.handleListVideoAnalysisRecords);
router.delete("/:id/analysis-results/:recordId", videoAnalysisRecordController_1.handleDeleteVideoAnalysisRecord);
router.get("/:id/analysis-artifacts", analysisArtifactController_1.handleListVideoAnalysisArtifacts);
router.get("/:id/analysis-artifacts/:artifactId/signed-url", analysisArtifactController_1.handleGetAnalysisArtifactSignedUrl);
router.get("/:id/analyzeVideo/:jobId/artifacts", analysisArtifactController_1.handleListAnalysisJobArtifacts);
router.post("/:videoId/analyze", aiAnalysisController_1.analyzeVideoController);
router.get("/gemini/tokens/last", aiAnalysisController_1.getLastGeminiTokenUsageController);
exports.default = router;
//# sourceMappingURL=videoRoutes.js.map