import express from "express";
import {
  handleCreateVideo,
  handleUploadVideo,
  handleUpdateVideo
} from "../controllers/videoController";

const router = express.Router();

// 📌 Endpoint para crear un nuevo video
router.post("/", handleCreateVideo);
router.put("/:id", handleUpdateVideo);
router.post("/upload", handleUploadVideo);

export default router;
