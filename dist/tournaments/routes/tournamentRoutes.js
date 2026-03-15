"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tournamentController_1 = require("../controllers/tournamentController");
const router = express_1.default.Router();
router.get("/", tournamentController_1.handleListTournaments);
router.post("/", tournamentController_1.handleCreateTournament);
router.post("/:id/generate-matches", tournamentController_1.handleGenerateTournamentMatches);
router.get("/:id", tournamentController_1.handleGetTournament);
router.put("/:id", tournamentController_1.handleUpdateTournament);
router.delete("/:id", tournamentController_1.handleDeleteTournament);
exports.default = router;
//# sourceMappingURL=tournamentRoutes.js.map