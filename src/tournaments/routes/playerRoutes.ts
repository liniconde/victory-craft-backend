import express from "express";
import {
  handleCreatePlayer,
  handleDeletePlayer,
  handleGetPlayer,
  handleListPlayers,
  handleUpdatePlayer,
} from "../controllers/playerController";

const router = express.Router();

router.get("/", handleListPlayers);
router.post("/", handleCreatePlayer);
router.get("/:id", handleGetPlayer);
router.put("/:id", handleUpdatePlayer);
router.delete("/:id", handleDeletePlayer);

export default router;
