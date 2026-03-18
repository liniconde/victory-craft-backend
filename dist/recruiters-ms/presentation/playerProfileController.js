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
exports.handleGetPlayerProfilesCatalog = exports.handleUnlinkVideoFromPlayerProfile = exports.handleListPlayerProfileVideos = exports.handleLinkVideoToPlayerProfile = exports.handleUpdatePlayerProfile = exports.handleGetPlayerProfileById = exports.handleListPlayerProfiles = exports.handleCreatePlayerProfile = exports.handleGetMyPlayerProfile = void 0;
const playerProfileService_1 = require("../application/playerProfileService");
const handleError = (res, error) => {
    if (error instanceof playerProfileService_1.PlayerProfileServiceError) {
        res.status(error.status).json({ message: error.message, code: error.code });
        return;
    }
    console.error(JSON.stringify({
        event: "player_profile_controller_error",
        message: (error === null || error === void 0 ? void 0 : error.message) || "Unknown error",
    }));
    res.status(500).json({ message: "Internal server error", code: "player_profile_internal_error" });
};
const handleGetMyPlayerProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, playerProfileService_1.getMyPlayerProfile)(req.user);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleGetMyPlayerProfile = handleGetMyPlayerProfile;
const handleCreatePlayerProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, playerProfileService_1.createPlayerProfile)(req.body || {}, req.user);
        res.status(201).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleCreatePlayerProfile = handleCreatePlayerProfile;
const handleListPlayerProfiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, playerProfileService_1.listPlayerProfiles)(req.query || {}, req.user);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleListPlayerProfiles = handleListPlayerProfiles;
const handleGetPlayerProfileById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, playerProfileService_1.getPlayerProfileById)(req.params.profileId, req.user);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleGetPlayerProfileById = handleGetPlayerProfileById;
const handleUpdatePlayerProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, playerProfileService_1.updatePlayerProfile)(req.params.profileId, req.body || {}, req.user);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleUpdatePlayerProfile = handleUpdatePlayerProfile;
const handleLinkVideoToPlayerProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, playerProfileService_1.linkVideoToPlayerProfile)(req.params.profileId, req.body || {}, req.user);
        res.status(201).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleLinkVideoToPlayerProfile = handleLinkVideoToPlayerProfile;
const handleListPlayerProfileVideos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, playerProfileService_1.listPlayerProfileVideos)(req.params.profileId, req.query || {}, req.user);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleListPlayerProfileVideos = handleListPlayerProfileVideos;
const handleUnlinkVideoFromPlayerProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, playerProfileService_1.unlinkVideoFromPlayerProfile)(req.params.profileId, req.params.videoId, req.user);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleUnlinkVideoFromPlayerProfile = handleUnlinkVideoFromPlayerProfile;
const handleGetPlayerProfilesCatalog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, playerProfileService_1.getPlayerProfilesCatalog)(req.user);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleGetPlayerProfilesCatalog = handleGetPlayerProfilesCatalog;
//# sourceMappingURL=playerProfileController.js.map