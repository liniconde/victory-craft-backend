"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const videoStatsController_1 = require("../controllers/videoStatsController");
const router = express_1.default.Router();
router.post("/", videoStatsController_1.handleCreateVideoStats);
router.get("/:videoId", videoStatsController_1.handleGetVideoStats);
router.put("/:videoId", videoStatsController_1.handleUpdateVideoStats);
router.delete("/:videoId", videoStatsController_1.handleDeleteVideoStats);
exports.default = router;
//# sourceMappingURL=videoStatsRoutes.js.map