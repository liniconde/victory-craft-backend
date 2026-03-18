import express from "express";
import {
  handleCreateVideo,
  handleCreateLibraryVideo,
  handleDeleteVideo,
  handleGetLibraryVideos,
  handleGetMyLibraryVideos,
  handleUploadVideo,
  handleUpdateVideo
} from "../controllers/videoController";
import {
  analyzeVideoController,
  getLastGeminiTokenUsageController,
} from "../controllers/aiAnalysisController";
import {
  handleCreateAnalyzeAgentJob,
  handleCreateAnalyzeVideoJob,
  handleGetAnalyzeVideoJobStatus,
} from "../controllers/analysisJobController";
import {
  handleGetAnalysisArtifactSignedUrl,
  handleListAnalysisJobArtifacts,
  handleListVideoAnalysisArtifacts,
} from "../controllers/analysisArtifactController";
import {
  handleDeleteVideoAnalysisRecord,
  handleListVideoAnalysisRecords,
} from "../controllers/videoAnalysisRecordController";
import { registerRecruitersMsVideoRoutes } from "../recruiters-ms/presentation/videoScoutingRoutes";
import { optionalAuth, requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

// 📌 Endpoint para crear un nuevo video
router.post("/", handleCreateVideo);
router.post("/library", optionalAuth, handleCreateLibraryVideo);
router.get("/library", optionalAuth, handleGetLibraryVideos);
router.get("/library/mine", requireAuth, handleGetMyLibraryVideos);
registerRecruitersMsVideoRoutes(router);
router.put("/:id", handleUpdateVideo);
router.delete("/:id", handleDeleteVideo);
router.post("/upload", handleUploadVideo);
router.post("/sign-upload", handleUploadVideo);
router.post("/:id/analyzeVideo", handleCreateAnalyzeVideoJob);
router.post("/:id/analyzeAgent", handleCreateAnalyzeAgentJob);
router.get("/:id/analyzeVideo/:jobId/status", handleGetAnalyzeVideoJobStatus);
router.get("/:id/analysis-results", handleListVideoAnalysisRecords);
router.delete("/:id/analysis-results/:recordId", handleDeleteVideoAnalysisRecord);
router.get("/:id/analysis-artifacts", handleListVideoAnalysisArtifacts);
router.get("/:id/analysis-artifacts/:artifactId/signed-url", handleGetAnalysisArtifactSignedUrl);
router.get("/:id/analyzeVideo/:jobId/artifacts", handleListAnalysisJobArtifacts);
router.post("/:videoId/analyze", analyzeVideoController);
router.get("/gemini/tokens/last", getLastGeminiTokenUsageController);

export default router;
