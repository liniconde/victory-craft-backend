import express from "express";
import {
  handleCreateMatch,
  handleDeleteMatch,
  handleGetMatch,
  handleListMatches,
  handleUpdateMatch,
} from "../controllers/matchController";

const router = express.Router();

router.get("/", handleListMatches);
router.post("/", handleCreateMatch);
router.get("/:id", handleGetMatch);
router.put("/:id", handleUpdateMatch);
router.delete("/:id", handleDeleteMatch);

export default router;
