import express from "express";
import {
  handleCreateVideoStats,
  handleGetVideoStats,
  handleUpdateVideoStats,
  handleDeleteVideoStats,
} from "../controllers/videoStatsController";

const router = express.Router();

router.post("/", handleCreateVideoStats);
router.get("/:videoId", handleGetVideoStats);
router.put("/:videoId", handleUpdateVideoStats);
router.delete("/:videoId", handleDeleteVideoStats);

export default router;
