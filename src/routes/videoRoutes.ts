import express from "express";
import {
  handleCreateVideo,
  handleCreateLibraryVideo,
  handleGetLibraryVideos,
  handleUploadVideo,
  handleUpdateVideo
} from "../controllers/videoController";
import { analyzeVideoController } from "../controllers/aiAnalysisController";

const router = express.Router();

// 📌 Endpoint para crear un nuevo video
router.post("/", handleCreateVideo);
router.post("/library", handleCreateLibraryVideo);
router.get("/library", handleGetLibraryVideos);
router.put("/:id", handleUpdateVideo);
router.post("/upload", handleUploadVideo);
router.post("/:videoId/analyze", analyzeVideoController);

export default router;
