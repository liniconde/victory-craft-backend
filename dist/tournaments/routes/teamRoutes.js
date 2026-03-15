"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const teamController_1 = require("../controllers/teamController");
const router = express_1.default.Router();
router.get("/", teamController_1.handleListTeams);
router.post("/", teamController_1.handleCreateTeam);
router.get("/:id", teamController_1.handleGetTeam);
router.put("/:id", teamController_1.handleUpdateTeam);
router.delete("/:id", teamController_1.handleDeleteTeam);
exports.default = router;
//# sourceMappingURL=teamRoutes.js.map