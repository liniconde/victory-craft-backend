import { Router } from "express";
import {
  handleCreateVideoScoutingProfile,
  handleDeleteMyVideoVote,
  handleDeleteVideoVoteByUser,
  handleGetTopVideoLibraryRankings,
  handleGetVideoLibraryFiltersCatalog,
  handleGetVideoLibraryRankings,
  handleGetVideoRecruiterView,
  handleGetVideoScoutingProfile,
  handleGetVideoVoteSummary,
  handleUpdateVideoScoutingProfile,
  handleUpsertVideoVote,
} from "./videoScoutingController";
import { optionalAuth, requireAuth } from "../../middlewares/authMiddleware";

export const registerRecruitersMsVideoRoutes = (router: Router) => {
  router.post("/library/:videoId/scouting-profile", requireAuth, handleCreateVideoScoutingProfile);
  router.get("/library/:videoId/scouting-profile", handleGetVideoScoutingProfile);
  router.put("/library/:videoId/scouting-profile", requireAuth, handleUpdateVideoScoutingProfile);
  router.post("/library/:videoId/votes", requireAuth, handleUpsertVideoVote);
  router.delete("/library/:videoId/votes/me", requireAuth, handleDeleteMyVideoVote);
  router.delete("/library/:videoId/votes/:userId", requireAuth, handleDeleteVideoVoteByUser);
  router.get("/library/:videoId/votes/summary", optionalAuth, handleGetVideoVoteSummary);
  router.get("/library/rankings", optionalAuth, handleGetVideoLibraryRankings);
  router.get("/library/rankings/top", optionalAuth, handleGetTopVideoLibraryRankings);
  router.get("/library/filters/catalog", handleGetVideoLibraryFiltersCatalog);
  router.get("/library/:videoId/recruiter-view", optionalAuth, handleGetVideoRecruiterView);
};
