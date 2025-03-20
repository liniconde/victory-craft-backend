import express from "express";
import {
  handleCreateVideo,
  handleUploadVideo,
} from "../controllers/videoController";

const router = express.Router();

// 📌 Endpoint para crear un nuevo video
router.post("/", handleCreateVideo);
router.post("/upload", handleUploadVideo);

export default router;
