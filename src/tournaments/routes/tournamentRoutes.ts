import express from "express";
import {
  handleCreateTournament,
  handleDeleteTournament,
  handleGenerateTournamentMatches,
  handleGetTournament,
  handleListTournaments,
  handleUpdateTournament,
} from "../controllers/tournamentController";

const router = express.Router();

router.get("/", handleListTournaments);
router.post("/", handleCreateTournament);
router.post("/:id/generate-matches", handleGenerateTournamentMatches);
router.get("/:id", handleGetTournament);
router.put("/:id", handleUpdateTournament);
router.delete("/:id", handleDeleteTournament);

export default router;
