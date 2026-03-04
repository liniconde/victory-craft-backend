"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const streamingController_1 = require("../controllers/streamingController");
const router = express_1.default.Router();
router.post("/match-sessions", authMiddleware_1.requireAuth, streamingController_1.handleCreateMatchSession);
router.post("/match-sessions/:id/rooms", authMiddleware_1.requireAuth, streamingController_1.handleCreateRoomForSession);
router.post("/match-sessions/:id/segments", authMiddleware_1.requireAuth, streamingController_1.handleCreateSegment);
router.get("/rooms/:id", authMiddleware_1.requireAuth, streamingController_1.handleGetRoom);
router.get("/rooms/:id/segments", authMiddleware_1.requireAuth, streamingController_1.handleGetRoomSegments);
router.post("/rooms/:id/join", authMiddleware_1.requireAuth, streamingController_1.handleJoinRoom);
router.post("/rooms/:id/leave", authMiddleware_1.requireAuth, streamingController_1.handleLeaveRoom);
router.post("/rooms/:id/close", authMiddleware_1.requireAuth, streamingController_1.handleCloseRoom);
router.get("/rooms/:id/events", authMiddleware_1.requireAuth, streamingController_1.handleSubscribeRoomEvents);
exports.default = router;
//# sourceMappingURL=streamingRoutes.js.map