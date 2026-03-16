import express from "express";
import tournamentRoutes from "./tournamentRoutes";
import teamRoutes from "./teamRoutes";
import playerRoutes from "./playerRoutes";
import matchRoutes from "./matchRoutes";
import matchStatRoutes from "./matchStatRoutes";

const router = express.Router();

router.use("/teams", teamRoutes);
router.use("/matches/players", playerRoutes);
router.use("/matches/match-stats", matchStatRoutes);
router.use("/matches", matchRoutes);
router.use("/", tournamentRoutes);

export default router;
