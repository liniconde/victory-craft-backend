"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetVideoRecruiterView = exports.handleGetVideoLibraryFiltersCatalog = exports.handleGetTopVideoLibraryRankings = exports.handleGetVideoLibraryRankings = exports.handleGetVideoVoteSummary = exports.handleDeleteVideoVoteByUser = exports.handleDeleteMyVideoVote = exports.handleUpsertVideoVote = exports.handleUpdateVideoScoutingProfile = exports.handleGetVideoScoutingProfile = exports.handleCreateVideoScoutingProfile = void 0;
const videoScoutingService_1 = require("../application/videoScoutingService");
const handleError = (res, error) => {
    if (error instanceof videoScoutingService_1.VideoScoutingServiceError) {
        res.status(error.status).json({ message: error.message, code: error.code });
        return;
    }
    console.error(JSON.stringify({
        event: "video_scouting_controller_error",
        message: (error === null || error === void 0 ? void 0 : error.message) || "Unknown error",
    }));
    res.status(500).json({ message: "Internal server error", code: "video_scouting_internal_error" });
};
const handleCreateVideoScoutingProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, videoScoutingService_1.createVideoScoutingProfile)(req.params.videoId, req.body || {}, req.user);
        res.status(201).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleCreateVideoScoutingProfile = handleCreateVideoScoutingProfile;
const handleGetVideoScoutingProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, videoScoutingService_1.getVideoScoutingProfile)(req.params.videoId);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleGetVideoScoutingProfile = handleGetVideoScoutingProfile;
const handleUpdateVideoScoutingProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, videoScoutingService_1.updateVideoScoutingProfile)(req.params.videoId, req.body || {}, req.user);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleUpdateVideoScoutingProfile = handleUpdateVideoScoutingProfile;
const handleUpsertVideoVote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, videoScoutingService_1.upsertVideoVote)(req.params.videoId, req.body || {}, req.user);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleUpsertVideoVote = handleUpsertVideoVote;
const handleDeleteMyVideoVote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const result = yield (0, videoScoutingService_1.deleteVideoVoteByUser)(req.params.videoId, userId, req.user);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleDeleteMyVideoVote = handleDeleteMyVideoVote;
const handleDeleteVideoVoteByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, videoScoutingService_1.deleteVideoVoteByUser)(req.params.videoId, req.params.userId, req.user);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleDeleteVideoVoteByUser = handleDeleteVideoVoteByUser;
const handleGetVideoVoteSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = yield (0, videoScoutingService_1.getVideoVoteSummary)(req.params.videoId, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleGetVideoVoteSummary = handleGetVideoVoteSummary;
const handleGetVideoLibraryRankings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = yield (0, videoScoutingService_1.getVideoLibraryRankings)(req.query || {}, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleGetVideoLibraryRankings = handleGetVideoLibraryRankings;
const handleGetTopVideoLibraryRankings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = yield (0, videoScoutingService_1.getTopVideoLibraryRankings)(req.query || {}, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        res.status(200).json({ items: result });
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleGetTopVideoLibraryRankings = handleGetTopVideoLibraryRankings;
const handleGetVideoLibraryFiltersCatalog = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, videoScoutingService_1.getVideoLibraryFiltersCatalog)();
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleGetVideoLibraryFiltersCatalog = handleGetVideoLibraryFiltersCatalog;
const handleGetVideoRecruiterView = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = yield (0, videoScoutingService_1.getVideoRecruiterView)(req.params.videoId, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleGetVideoRecruiterView = handleGetVideoRecruiterView;
//# sourceMappingURL=videoScoutingController.js.map