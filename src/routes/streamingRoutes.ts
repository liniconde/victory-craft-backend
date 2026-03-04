import express from "express";
import { requireAuth } from "../middlewares/authMiddleware";
import {
  handleCreateMatchSession,
  handleCreateRoomForSession,
  handleCreateSegment,
  handleGetRoom,
  handleGetRoomSegments,
  handleJoinRoom,
  handleLeaveRoom,
  handleCloseRoom,
  handleSubscribeRoomEvents,
} from "../controllers/streamingController";

const router = express.Router();

router.post("/match-sessions", requireAuth, handleCreateMatchSession);
router.post("/match-sessions/:id/rooms", requireAuth, handleCreateRoomForSession);
router.post("/match-sessions/:id/segments", requireAuth, handleCreateSegment);

router.get("/rooms/:id", requireAuth, handleGetRoom);
router.get("/rooms/:id/segments", requireAuth, handleGetRoomSegments);
router.post("/rooms/:id/join", requireAuth, handleJoinRoom);
router.post("/rooms/:id/leave", requireAuth, handleLeaveRoom);
router.post("/rooms/:id/close", requireAuth, handleCloseRoom);
router.get("/rooms/:id/events", requireAuth, handleSubscribeRoomEvents);

export default router;
