"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const matchStatController_1 = require("../controllers/matchStatController");
const router = express_1.default.Router();
router.get("/", matchStatController_1.handleListMatchStats);
router.post("/", matchStatController_1.handleCreateMatchStat);
router.get("/:id", matchStatController_1.handleGetMatchStat);
router.put("/:id", matchStatController_1.handleUpdateMatchStat);
router.delete("/:id", matchStatController_1.handleDeleteMatchStat);
exports.default = router;
//# sourceMappingURL=matchStatRoutes.js.map