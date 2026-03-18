"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const playerProfileController_1 = require("./playerProfileController");
const router = express_1.default.Router();
router.get("/player-profiles/me", authMiddleware_1.requireAuth, playerProfileController_1.handleGetMyPlayerProfile);
router.post("/player-profiles", authMiddleware_1.requireAuth, playerProfileController_1.handleCreatePlayerProfile);
router.get("/player-profiles", authMiddleware_1.requireAuth, playerProfileController_1.handleListPlayerProfiles);
router.get("/player-profiles/catalog", authMiddleware_1.requireAuth, playerProfileController_1.handleGetPlayerProfilesCatalog);
router.get("/player-profiles/:profileId", authMiddleware_1.requireAuth, playerProfileController_1.handleGetPlayerProfileById);
router.put("/player-profiles/:profileId", authMiddleware_1.requireAuth, playerProfileController_1.handleUpdatePlayerProfile);
router.post("/player-profiles/:profileId/videos", authMiddleware_1.requireAuth, playerProfileController_1.handleLinkVideoToPlayerProfile);
router.get("/player-profiles/:profileId/videos", authMiddleware_1.requireAuth, playerProfileController_1.handleListPlayerProfileVideos);
router.delete("/player-profiles/:profileId/videos/:videoId", authMiddleware_1.requireAuth, playerProfileController_1.handleUnlinkVideoFromPlayerProfile);
exports.default = router;
//# sourceMappingURL=recruiterRoutes.js.map