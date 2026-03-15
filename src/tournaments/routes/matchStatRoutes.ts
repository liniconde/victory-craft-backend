import express from "express";
import {
  handleCreateMatchStat,
  handleDeleteMatchStat,
  handleGetMatchStat,
  handleListMatchStats,
  handleUpdateMatchStat,
} from "../controllers/matchStatController";

const router = express.Router();

router.get("/", handleListMatchStats);
router.post("/", handleCreateMatchStat);
router.get("/:id", handleGetMatchStat);
router.put("/:id", handleUpdateMatchStat);
router.delete("/:id", handleDeleteMatchStat);

export default router;
