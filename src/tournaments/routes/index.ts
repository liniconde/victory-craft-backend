import express from "express";
import tournamentRoutes from "./tournamentRoutes";
import teamRoutes from "./teamRoutes";
import playerRoutes from "./playerRoutes";
import matchRoutes from "./matchRoutes";
import matchStatRoutes from "./matchStatRoutes";

const router = express.Router();

router.use("/", tournamentRoutes);
router.use("/teams", teamRoutes);
router.use("/matches", matchRoutes);
router.use("/matches/players", playerRoutes);
router.use("/matches/match-stats", matchStatRoutes);

export default router;
