"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRecruitersMsVideoRoutes = void 0;
const videoScoutingController_1 = require("./videoScoutingController");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const registerRecruitersMsVideoRoutes = (router) => {
    router.post("/library/:videoId/scouting-profile", authMiddleware_1.requireAuth, videoScoutingController_1.handleCreateVideoScoutingProfile);
    router.get("/library/:videoId/scouting-profile", videoScoutingController_1.handleGetVideoScoutingProfile);
    router.put("/library/:videoId/scouting-profile", authMiddleware_1.requireAuth, videoScoutingController_1.handleUpdateVideoScoutingProfile);
    router.post("/library/:videoId/votes", authMiddleware_1.requireAuth, videoScoutingController_1.handleUpsertVideoVote);
    router.delete("/library/:videoId/votes/me", authMiddleware_1.requireAuth, videoScoutingController_1.handleDeleteMyVideoVote);
    router.delete("/library/:videoId/votes/:userId", authMiddleware_1.requireAuth, videoScoutingController_1.handleDeleteVideoVoteByUser);
    router.get("/library/:videoId/votes/summary", authMiddleware_1.optionalAuth, videoScoutingController_1.handleGetVideoVoteSummary);
    router.get("/library/rankings", authMiddleware_1.optionalAuth, videoScoutingController_1.handleGetVideoLibraryRankings);
    router.get("/library/rankings/top", authMiddleware_1.optionalAuth, videoScoutingController_1.handleGetTopVideoLibraryRankings);
    router.get("/library/filters/catalog", videoScoutingController_1.handleGetVideoLibraryFiltersCatalog);
    router.get("/library/:videoId/recruiter-view", authMiddleware_1.optionalAuth, videoScoutingController_1.handleGetVideoRecruiterView);
};
exports.registerRecruitersMsVideoRoutes = registerRecruitersMsVideoRoutes;
//# sourceMappingURL=videoScoutingRoutes.js.map