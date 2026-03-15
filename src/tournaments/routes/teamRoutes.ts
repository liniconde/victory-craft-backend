import express from "express";
import {
  handleCreateTeam,
  handleDeleteTeam,
  handleGetTeam,
  handleListTeams,
  handleUpdateTeam,
} from "../controllers/teamController";

const router = express.Router();

router.get("/", handleListTeams);
router.post("/", handleCreateTeam);
router.get("/:id", handleGetTeam);
router.put("/:id", handleUpdateTeam);
router.delete("/:id", handleDeleteTeam);

export default router;
