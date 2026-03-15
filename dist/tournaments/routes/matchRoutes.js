"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const matchController_1 = require("../controllers/matchController");
const router = express_1.default.Router();
router.get("/", matchController_1.handleListMatches);
router.post("/", matchController_1.handleCreateMatch);
router.get("/:id", matchController_1.handleGetMatch);
router.put("/:id", matchController_1.handleUpdateMatch);
router.delete("/:id", matchController_1.handleDeleteMatch);
exports.default = router;
//# sourceMappingURL=matchRoutes.js.map