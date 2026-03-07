import express from "express";
import {
  handleCreateVideoStats,
  handleListFootballVideosWithGoals,
  handleGetVideoStats,
  handleUpdateVideoStats,
  handleDeleteVideoStats,
} from "../controllers/videoStatsController";

const router = express.Router();

router.post("/", handleCreateVideoStats);
router.get("/football/videos-with-goals", handleListFootballVideosWithGoals);
router.get("/:videoId", handleGetVideoStats);
router.put("/:videoId", handleUpdateVideoStats);
router.delete("/:videoId", handleDeleteVideoStats);

export default router;
