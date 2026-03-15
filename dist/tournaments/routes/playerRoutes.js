"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const playerController_1 = require("../controllers/playerController");
const router = express_1.default.Router();
router.get("/", playerController_1.handleListPlayers);
router.post("/", playerController_1.handleCreatePlayer);
router.get("/:id", playerController_1.handleGetPlayer);
router.put("/:id", playerController_1.handleUpdatePlayer);
router.delete("/:id", playerController_1.handleDeletePlayer);
exports.default = router;
//# sourceMappingURL=playerRoutes.js.map