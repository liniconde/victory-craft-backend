import express from "express";
import { requireAuth } from "../../middlewares/authMiddleware";
import {
  handleCreatePlayerProfile,
  handleGetMyPlayerProfile,
  handleGetPlayerProfileById,
  handleGetPlayerProfilesCatalog,
  handleLinkVideoToPlayerProfile,
  handleListPlayerProfileVideos,
  handleListPlayerProfiles,
  handleUnlinkVideoFromPlayerProfile,
  handleUpdatePlayerProfile,
} from "./playerProfileController";

const router = express.Router();

router.get("/player-profiles/me", requireAuth, handleGetMyPlayerProfile);
router.post("/player-profiles", requireAuth, handleCreatePlayerProfile);
router.get("/player-profiles", requireAuth, handleListPlayerProfiles);
router.get("/player-profiles/catalog", requireAuth, handleGetPlayerProfilesCatalog);
router.get("/player-profiles/:profileId", requireAuth, handleGetPlayerProfileById);
router.put("/player-profiles/:profileId", requireAuth, handleUpdatePlayerProfile);
router.post("/player-profiles/:profileId/videos", requireAuth, handleLinkVideoToPlayerProfile);
router.get("/player-profiles/:profileId/videos", requireAuth, handleListPlayerProfileVideos);
router.delete("/player-profiles/:profileId/videos/:videoId", requireAuth, handleUnlinkVideoFromPlayerProfile);

export default router;
