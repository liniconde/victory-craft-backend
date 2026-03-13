import express from "express";
import {
  handleCreateVideo,
  handleCreateLibraryVideo,
  handleDeleteVideo,
  handleGetLibraryVideos,
  handleUploadVideo,
  handleUpdateVideo
} from "../controllers/videoController";
import { analyzeVideoController } from "../controllers/aiAnalysisController";
import {
  handleCreateAnalyzeAgentJob,
  handleCreateAnalyzeVideoJob,
  handleGetAnalyzeVideoJobStatus,
} from "../controllers/analysisJobController";
import {
  handleListAnalysisJobArtifacts,
  handleListVideoAnalysisArtifacts,
} from "../controllers/analysisArtifactController";
import {
  handleDeleteVideoAnalysisRecord,
  handleListVideoAnalysisRecords,
} from "../controllers/videoAnalysisRecordController";

const router = express.Router();

// 📌 Endpoint para crear un nuevo video
router.post("/", handleCreateVideo);
router.post("/library", handleCreateLibraryVideo);
router.get("/library", handleGetLibraryVideos);
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
router.get("/:id/analyzeVideo/:jobId/artifacts", handleListAnalysisJobArtifacts);
router.post("/:videoId/analyze", analyzeVideoController);

export default router;
