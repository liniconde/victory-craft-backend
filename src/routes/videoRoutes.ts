import express from "express";
import {
  handleCreateVideo,
  handleCreateLibraryVideo,
  handleDeleteVideo,
  handleGetLibraryVideos,
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
import {
  handleCreateVideoScoutingProfile,
  handleDeleteMyVideoVote,
  handleDeleteVideoVoteByUser,
  handleGetTopVideoLibraryRankings,
  handleGetVideoLibraryFiltersCatalog,
  handleGetVideoLibraryRankings,
  handleGetVideoRecruiterView,
  handleGetVideoScoutingProfile,
  handleGetVideoVoteSummary,
  handleUpdateVideoScoutingProfile,
  handleUpsertVideoVote,
} from "../controllers/videoScoutingController";
import { optionalAuth, requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

// 📌 Endpoint para crear un nuevo video
router.post("/", handleCreateVideo);
router.post("/library", handleCreateLibraryVideo);
router.get("/library", handleGetLibraryVideos);
router.post("/library/:videoId/scouting-profile", requireAuth, handleCreateVideoScoutingProfile);
router.get("/library/:videoId/scouting-profile", handleGetVideoScoutingProfile);
router.put("/library/:videoId/scouting-profile", requireAuth, handleUpdateVideoScoutingProfile);
router.post("/library/:videoId/votes", requireAuth, handleUpsertVideoVote);
router.delete("/library/:videoId/votes/me", requireAuth, handleDeleteMyVideoVote);
router.delete("/library/:videoId/votes/:userId", requireAuth, handleDeleteVideoVoteByUser);
router.get("/library/:videoId/votes/summary", optionalAuth, handleGetVideoVoteSummary);
router.get("/library/rankings", optionalAuth, handleGetVideoLibraryRankings);
router.get("/library/rankings/top", optionalAuth, handleGetTopVideoLibraryRankings);
router.get("/library/filters/catalog", handleGetVideoLibraryFiltersCatalog);
router.get("/library/:videoId/recruiter-view", optionalAuth, handleGetVideoRecruiterView);
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
