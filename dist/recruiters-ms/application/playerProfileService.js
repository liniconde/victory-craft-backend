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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlayerProfilesCatalog = exports.unlinkVideoFromPlayerProfile = exports.listPlayerProfileVideos = exports.linkVideoToPlayerProfile = exports.updatePlayerProfile = exports.getPlayerProfileById = exports.listPlayerProfiles = exports.createPlayerProfile = exports.getMyPlayerProfile = exports.PlayerProfileServiceError = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const PlayerProfile_1 = __importDefault(require("../infrastructure/models/PlayerProfile"));
const PlayerProfileVideoLink_1 = __importDefault(require("../infrastructure/models/PlayerProfileVideoLink"));
const VideoScoutingProfile_1 = __importDefault(require("../infrastructure/models/VideoScoutingProfile"));
const User_1 = __importDefault(require("../../models/User"));
const Video_1 = __importDefault(require("../../models/Video"));
const playerProfileContracts_1 = require("../domain/playerProfileContracts");
const s3FilesService_1 = require("../../services/s3FilesService");
class PlayerProfileServiceError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.PlayerProfileServiceError = PlayerProfileServiceError;
const isObjectId = (value) => Boolean(value && mongoose_1.default.Types.ObjectId.isValid(value));
const toObjectId = (value, fieldName) => {
    if (!isObjectId(value)) {
        throw new PlayerProfileServiceError(400, "invalid_object_id", `${fieldName} is invalid`);
    }
    return new mongoose_1.default.Types.ObjectId(value);
};
const parseZod = (result, code) => {
    var _a;
    if (!result.success) {
        throw new PlayerProfileServiceError(400, code, ((_a = result.error) === null || _a === void 0 ? void 0 : _a.message) || "Invalid payload");
    }
    return result.data;
};
const isPrivilegedRole = (role) => {
    const normalized = (role || "").toLowerCase();
    return normalized === "admin" || normalized === "recruiter";
};
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizePlayerProfilePayload = (payload) => {
    const data = Object.assign({}, payload);
    if (typeof payload.birthDate === "string") {
        data.birthDate = new Date(payload.birthDate);
    }
    if (typeof payload.email === "string") {
        data.email = payload.email.trim().toLowerCase();
    }
    return data;
};
const ensureAuthenticatedUser = (authUser) => {
    if (!(authUser === null || authUser === void 0 ? void 0 : authUser.id)) {
        throw new PlayerProfileServiceError(401, "unauthorized", "Authentication is required");
    }
    return authUser;
};
const mapPlayerProfileSummary = (profile) => ({
    _id: profile._id,
    userId: profile.userId || null,
    email: profile.email || null,
    fullName: profile.fullName,
    sportType: profile.sportType,
    primaryPosition: profile.primaryPosition,
    secondaryPosition: profile.secondaryPosition,
    team: profile.team,
    category: profile.category,
    country: profile.country,
    city: profile.city,
    avatarUrl: profile.avatarUrl,
    status: profile.status,
});
const mapPlayerProfile = (profile) => (Object.assign(Object.assign({}, mapPlayerProfileSummary(profile)), { birthDate: profile.birthDate, dominantProfile: profile.dominantProfile, bio: profile.bio, createdBy: profile.createdBy || null, updatedBy: profile.updatedBy || null, createdAt: profile.createdAt, updatedAt: profile.updatedAt }));
const mapVideoSummary = (video) => ({
    _id: video._id,
    s3Key: video.s3Key,
    uploadedAt: video.uploadedAt,
    videoUrl: video.s3Key ? (0, s3FilesService_1.getObjectS3SignedUrl)(video.s3Key) : undefined,
    sportType: video.sportType,
    ownerUserId: video.ownerUserId || null,
});
const mapLink = (link) => ({
    _id: link._id,
    playerProfileId: link.playerProfileId,
    videoId: link.videoId,
    linkedBy: link.linkedBy || null,
    notes: link.notes,
    tags: link.tags || [],
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
});
const ensurePlayerProfileExists = (profileId) => __awaiter(void 0, void 0, void 0, function* () {
    const objectId = toObjectId(profileId, "profileId");
    const profile = yield PlayerProfile_1.default.findById(objectId).lean();
    if (!profile) {
        throw new PlayerProfileServiceError(404, "player_profile_not_found", "Player profile not found");
    }
    return profile;
});
const ensureLibraryVideoExists = (videoId) => __awaiter(void 0, void 0, void 0, function* () {
    const objectId = toObjectId(videoId, "videoId");
    const video = yield Video_1.default.findOne({ _id: objectId, videoType: "library" }).lean();
    if (!video) {
        throw new PlayerProfileServiceError(404, "video_not_found", "Library video not found");
    }
    return video;
});
const ensureProfileAccess = (profile, authUser) => {
    if (isPrivilegedRole(authUser.role))
        return;
    if (!authUser.id || String(profile.userId || "") !== authUser.id) {
        throw new PlayerProfileServiceError(403, "forbidden", "Insufficient permissions for this player profile");
    }
};
const resolveTargetUser = (payload, authUser) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!authUser.id) {
        throw new PlayerProfileServiceError(401, "unauthorized", "Authentication is required");
    }
    if (!isPrivilegedRole(authUser.role)) {
        return {
            userId: new mongoose_1.default.Types.ObjectId(authUser.id),
            email: ((_a = authUser.email) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) || undefined,
        };
    }
    let targetUserId = payload.userId;
    let targetEmail = (_b = payload.email) === null || _b === void 0 ? void 0 : _b.trim().toLowerCase();
    if (targetUserId) {
        const user = yield User_1.default.findById(toObjectId(targetUserId, "userId")).select({ _id: 1, email: 1 }).lean();
        if (!user) {
            throw new PlayerProfileServiceError(404, "user_not_found", "Target user not found");
        }
        targetUserId = String(user._id);
        targetEmail = targetEmail || user.email;
    }
    else if (targetEmail) {
        const user = yield User_1.default.findOne({ email: targetEmail }).select({ _id: 1, email: 1 }).lean();
        if (user) {
            targetUserId = String(user._id);
            targetEmail = user.email;
        }
    }
    return {
        userId: targetUserId ? new mongoose_1.default.Types.ObjectId(targetUserId) : undefined,
        email: targetEmail,
    };
});
const getMyPlayerProfile = (authUser) => __awaiter(void 0, void 0, void 0, function* () {
    const user = ensureAuthenticatedUser(authUser);
    const profile = yield PlayerProfile_1.default.findOne({ userId: toObjectId(user.id, "userId") }).lean();
    if (!profile) {
        throw new PlayerProfileServiceError(404, "player_profile_not_found", "Player profile not found");
    }
    return mapPlayerProfile(profile);
});
exports.getMyPlayerProfile = getMyPlayerProfile;
const createPlayerProfile = (payload, authUser) => __awaiter(void 0, void 0, void 0, function* () {
    const user = ensureAuthenticatedUser(authUser);
    const parsed = parseZod(playerProfileContracts_1.createPlayerProfileSchema.safeParse(payload), "invalid_player_profile_payload");
    const target = yield resolveTargetUser(parsed, user);
    const normalized = normalizePlayerProfilePayload(parsed);
    const actorId = isObjectId(user.id) ? new mongoose_1.default.Types.ObjectId(user.id) : undefined;
    try {
        const created = yield PlayerProfile_1.default.create(Object.assign(Object.assign({}, normalized), { userId: target.userId, email: target.email || normalized.email, createdBy: actorId, updatedBy: actorId }));
        return mapPlayerProfile(created.toObject());
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === 11000) {
            throw new PlayerProfileServiceError(409, "player_profile_conflict", "Player profile already exists");
        }
        throw error;
    }
});
exports.createPlayerProfile = createPlayerProfile;
const listPlayerProfiles = (query, authUser) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const user = ensureAuthenticatedUser(authUser);
    const parsed = parseZod(playerProfileContracts_1.listPlayerProfilesQuerySchema.safeParse(query), "invalid_player_profiles_query");
    const match = {};
    if (parsed.email)
        match.email = { $regex: escapeRegex(parsed.email), $options: "i" };
    if (parsed.team)
        match.team = { $regex: escapeRegex(parsed.team), $options: "i" };
    if (parsed.sportType)
        match.sportType = parsed.sportType;
    if (parsed.country)
        match.country = parsed.country;
    if (parsed.city)
        match.city = parsed.city;
    if (parsed.category)
        match.category = parsed.category;
    if (parsed.status)
        match.status = parsed.status;
    if (!isPrivilegedRole(user.role)) {
        match.userId = toObjectId(user.id, "userId");
    }
    const nameRegex = parsed.fullName || parsed.userName
        ? { $regex: escapeRegex((parsed.fullName || parsed.userName)), $options: "i" }
        : null;
    const page = parsed.page;
    const limit = parsed.limit;
    const skip = (page - 1) * limit;
    const rows = yield PlayerProfile_1.default.aggregate([
        { $match: match },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        ...(nameRegex
            ? [
                {
                    $match: {
                        $or: [{ fullName: nameRegex }, { "user.username": nameRegex }],
                    },
                },
            ]
            : []),
        { $sort: { updatedAt: -1, _id: -1 } },
        {
            $facet: {
                items: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 1,
                            userId: 1,
                            email: 1,
                            fullName: 1,
                            sportType: 1,
                            primaryPosition: 1,
                            secondaryPosition: 1,
                            team: 1,
                            category: 1,
                            country: 1,
                            city: 1,
                            avatarUrl: 1,
                            status: 1,
                            userName: "$user.username",
                        },
                    },
                ],
                totalCount: [{ $count: "count" }],
            },
        },
    ]);
    const items = ((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.items) || [];
    const total = ((_d = (_c = (_b = rows[0]) === null || _b === void 0 ? void 0 : _b.totalCount) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.count) || 0;
    return {
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
        },
    };
});
exports.listPlayerProfiles = listPlayerProfiles;
const getPlayerProfileById = (profileId, authUser) => __awaiter(void 0, void 0, void 0, function* () {
    const user = ensureAuthenticatedUser(authUser);
    const profile = yield ensurePlayerProfileExists(profileId);
    ensureProfileAccess(profile, user);
    return mapPlayerProfile(profile);
});
exports.getPlayerProfileById = getPlayerProfileById;
const updatePlayerProfile = (profileId, payload, authUser) => __awaiter(void 0, void 0, void 0, function* () {
    const user = ensureAuthenticatedUser(authUser);
    const profile = yield ensurePlayerProfileExists(profileId);
    ensureProfileAccess(profile, user);
    const parsed = parseZod(playerProfileContracts_1.updatePlayerProfileSchema.safeParse(payload), "invalid_player_profile_payload");
    const normalized = normalizePlayerProfilePayload(parsed);
    if (!isPrivilegedRole(user.role)) {
        delete normalized.userId;
        delete normalized.email;
        delete normalized.status;
    }
    const updatedBy = isObjectId(user.id) ? new mongoose_1.default.Types.ObjectId(user.id) : undefined;
    if (updatedBy) {
        normalized.updatedBy = updatedBy;
    }
    try {
        const updated = yield PlayerProfile_1.default.findByIdAndUpdate(profile._id, { $set: normalized }, { new: true }).lean();
        if (!updated) {
            throw new PlayerProfileServiceError(404, "player_profile_not_found", "Player profile not found");
        }
        return mapPlayerProfile(updated);
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === 11000) {
            throw new PlayerProfileServiceError(409, "player_profile_conflict", "Player profile already exists");
        }
        throw error;
    }
});
exports.updatePlayerProfile = updatePlayerProfile;
const linkVideoToPlayerProfile = (profileId, payload, authUser) => __awaiter(void 0, void 0, void 0, function* () {
    const user = ensureAuthenticatedUser(authUser);
    const parsed = parseZod(playerProfileContracts_1.linkPlayerProfileVideoSchema.safeParse(payload), "invalid_player_profile_video_payload");
    const profile = yield ensurePlayerProfileExists(profileId);
    const video = yield ensureLibraryVideoExists(parsed.videoId);
    ensureProfileAccess(profile, user);
    if (!isPrivilegedRole(user.role) && String(video.ownerUserId || "") !== user.id) {
        throw new PlayerProfileServiceError(403, "forbidden", "Users can only link their own library videos");
    }
    try {
        const linkedBy = isObjectId(user.id) ? new mongoose_1.default.Types.ObjectId(user.id) : undefined;
        const created = yield PlayerProfileVideoLink_1.default.create({
            playerProfileId: profile._id,
            videoId: video._id,
            linkedBy,
            notes: parsed.notes,
            tags: parsed.tags || [],
        });
        yield VideoScoutingProfile_1.default.findOneAndUpdate({ videoId: video._id }, { $set: { playerProfileId: profile._id } }, { new: false });
        return {
            link: mapLink(created.toObject()),
            playerProfile: mapPlayerProfileSummary(profile),
            video: mapVideoSummary(video),
        };
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === 11000) {
            throw new PlayerProfileServiceError(409, "player_profile_video_conflict", "Video is already linked to a player profile");
        }
        throw error;
    }
});
exports.linkVideoToPlayerProfile = linkVideoToPlayerProfile;
const listPlayerProfileVideos = (profileId, query, authUser) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const user = ensureAuthenticatedUser(authUser);
    const parsed = parseZod(playerProfileContracts_1.listLinkedVideosQuerySchema.safeParse(query), "invalid_player_profile_videos_query");
    const profile = yield ensurePlayerProfileExists(profileId);
    ensureProfileAccess(profile, user);
    const page = parsed.page;
    const limit = parsed.limit;
    const skip = (page - 1) * limit;
    const rows = yield PlayerProfileVideoLink_1.default.aggregate([
        { $match: { playerProfileId: profile._id } },
        { $sort: { createdAt: -1, _id: -1 } },
        {
            $facet: {
                items: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: "videos",
                            localField: "videoId",
                            foreignField: "_id",
                            as: "video",
                        },
                    },
                    { $unwind: "$video" },
                    {
                        $project: {
                            _id: 1,
                            playerProfileId: 1,
                            videoId: 1,
                            linkedBy: 1,
                            notes: 1,
                            tags: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            video: {
                                _id: "$video._id",
                                s3Key: "$video.s3Key",
                                uploadedAt: "$video.uploadedAt",
                                sportType: "$video.sportType",
                                ownerUserId: "$video.ownerUserId",
                            },
                        },
                    },
                ],
                totalCount: [{ $count: "count" }],
            },
        },
    ]);
    const items = (((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.items) || []).map((item) => ({
        link: mapLink(item),
        video: mapVideoSummary(item.video),
    }));
    const total = ((_d = (_c = (_b = rows[0]) === null || _b === void 0 ? void 0 : _b.totalCount) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.count) || 0;
    return {
        playerProfile: mapPlayerProfileSummary(profile),
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
        },
    };
});
exports.listPlayerProfileVideos = listPlayerProfileVideos;
const unlinkVideoFromPlayerProfile = (profileId, videoId, authUser) => __awaiter(void 0, void 0, void 0, function* () {
    const user = ensureAuthenticatedUser(authUser);
    const profile = yield ensurePlayerProfileExists(profileId);
    ensureProfileAccess(profile, user);
    const video = yield ensureLibraryVideoExists(videoId);
    if (!isPrivilegedRole(user.role) && String(video.ownerUserId || "") !== user.id) {
        throw new PlayerProfileServiceError(403, "forbidden", "Users can only unlink their own library videos");
    }
    const deleted = yield PlayerProfileVideoLink_1.default.findOneAndDelete({
        playerProfileId: profile._id,
        videoId: video._id,
    }).lean();
    if (!deleted) {
        throw new PlayerProfileServiceError(404, "player_profile_video_not_found", "Linked video not found");
    }
    yield VideoScoutingProfile_1.default.findOneAndUpdate({ videoId: video._id, playerProfileId: profile._id }, { $unset: { playerProfileId: 1 } }, { new: false });
    return {
        message: "Video unlinked successfully",
        playerProfile: mapPlayerProfileSummary(profile),
        video: mapVideoSummary(video),
    };
});
exports.unlinkVideoFromPlayerProfile = unlinkVideoFromPlayerProfile;
const getPlayerProfilesCatalog = (_authUser) => __awaiter(void 0, void 0, void 0, function* () {
    const rows = yield PlayerProfile_1.default.aggregate([
        {
            $group: {
                _id: null,
                sportTypes: { $addToSet: "$sportType" },
                primaryPositions: { $addToSet: "$primaryPosition" },
                secondaryPositions: { $addToSet: "$secondaryPosition" },
                categories: { $addToSet: "$category" },
                countries: { $addToSet: "$country" },
                cities: { $addToSet: "$city" },
                teams: { $addToSet: "$team" },
                statuses: { $addToSet: "$status" },
            },
        },
    ]);
    const values = rows[0] || {};
    const sortTextArray = (items) => [...new Set(items.filter((item) => Boolean(item && item.trim())).map((item) => item.trim()))].sort((a, b) => a.localeCompare(b));
    return {
        sportTypes: sortTextArray(values.sportTypes || []),
        positions: sortTextArray([...(values.primaryPositions || []), ...(values.secondaryPositions || [])]),
        categories: sortTextArray(values.categories || []),
        countries: sortTextArray(values.countries || []),
        cities: sortTextArray(values.cities || []),
        teams: sortTextArray(values.teams || []),
        statuses: sortTextArray(values.statuses || ["draft", "active", "archived"]),
    };
});
exports.getPlayerProfilesCatalog = getPlayerProfilesCatalog;
//# sourceMappingURL=playerProfileService.js.map