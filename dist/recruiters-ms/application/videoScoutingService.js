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
exports.getVideoRecruiterView = exports.getVideoLibraryFiltersCatalog = exports.getTopVideoLibraryRankings = exports.getVideoLibraryRankings = exports.getVideoVoteSummary = exports.deleteVideoVoteByUser = exports.upsertVideoVote = exports.updateVideoScoutingProfile = exports.getVideoScoutingProfile = exports.createVideoScoutingProfile = exports.VideoScoutingServiceError = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const PlayerProfile_1 = __importDefault(require("../infrastructure/models/PlayerProfile"));
const PlayerProfileVideoLink_1 = __importDefault(require("../infrastructure/models/PlayerProfileVideoLink"));
const VideoScoutingProfile_1 = __importDefault(require("../infrastructure/models/VideoScoutingProfile"));
const Video_1 = __importDefault(require("../../models/Video"));
const VideoVote_1 = __importDefault(require("../../models/VideoVote"));
const videoScoutingContracts_1 = require("../domain/videoScoutingContracts");
const s3FilesService_1 = require("../../services/s3FilesService");
const sportTypes_1 = require("../../shared/sportTypes");
class VideoScoutingServiceError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.VideoScoutingServiceError = VideoScoutingServiceError;
const isObjectId = (value) => mongoose_1.default.Types.ObjectId.isValid(value);
const toObjectId = (value, fieldName) => {
    if (!isObjectId(value)) {
        throw new VideoScoutingServiceError(400, "invalid_object_id", `${fieldName} is invalid`);
    }
    return new mongoose_1.default.Types.ObjectId(value);
};
const parseZod = (result, code) => {
    var _a;
    if (!result.success) {
        throw new VideoScoutingServiceError(400, code, ((_a = result.error) === null || _a === void 0 ? void 0 : _a.message) || "Invalid payload");
    }
    return result.data;
};
const normalizeScoutingPayload = (payload) => {
    const data = Object.assign({}, payload);
    if (typeof payload.recordedAt === "string") {
        data.recordedAt = new Date(payload.recordedAt);
    }
    if (Array.isArray(payload.tags)) {
        data.tags = payload.tags.map((tag) => tag.trim()).filter(Boolean);
    }
    return data;
};
const playerProfileHydratedFieldMap = {
    playerName: "fullName",
    playerPosition: "primaryPosition",
    playerTeam: "team",
    playerCategory: "category",
    dominantProfile: "dominantProfile",
    country: "country",
    city: "city",
};
const getPlayerProfileForScouting = (playerProfileId) => __awaiter(void 0, void 0, void 0, function* () {
    const objectId = toObjectId(playerProfileId, "playerProfileId");
    const profile = yield PlayerProfile_1.default.findById(objectId)
        .select({
        _id: 1,
        userId: 1,
        fullName: 1,
        primaryPosition: 1,
        team: 1,
        category: 1,
        dominantProfile: 1,
        country: 1,
        city: 1,
    })
        .lean();
    if (!profile) {
        throw new VideoScoutingServiceError(404, "player_profile_not_found", "Player profile not found");
    }
    return profile;
});
const hydrateScoutingPayloadFromPlayerProfile = (payload, playerProfileId) => __awaiter(void 0, void 0, void 0, function* () {
    const data = normalizeScoutingPayload(payload);
    data.playerProfileId = playerProfileId;
    const playerProfile = yield getPlayerProfileForScouting(playerProfileId);
    for (const [targetField, sourceField] of Object.entries(playerProfileHydratedFieldMap)) {
        const currentValue = data[targetField];
        const hasValue = Array.isArray(currentValue)
            ? currentValue.length > 0
            : currentValue !== null && currentValue !== undefined && String(currentValue).trim() !== "";
        if (!hasValue) {
            const profileValue = playerProfile[sourceField];
            if (profileValue !== null && profileValue !== undefined && String(profileValue).trim() !== "") {
                data[targetField] = profileValue;
            }
        }
    }
    return data;
});
const getLinkedPlayerProfileForVideo = (videoId, playerProfileId) => __awaiter(void 0, void 0, void 0, function* () {
    const playerProfileObjectId = toObjectId(playerProfileId, "playerProfileId");
    const link = yield PlayerProfileVideoLink_1.default.findOne({
        videoId,
        playerProfileId: playerProfileObjectId,
    })
        .select({ _id: 1, playerProfileId: 1, videoId: 1 })
        .lean();
    if (!link) {
        throw new VideoScoutingServiceError(409, "player_profile_video_not_linked", "Video must be linked to the selected player profile before it can be published");
    }
    return playerProfileId;
});
const getExistingScoutingProfileOrThrow = (videoObjectId) => __awaiter(void 0, void 0, void 0, function* () {
    const profile = yield VideoScoutingProfile_1.default.findOne({ videoId: videoObjectId }).lean();
    if (!profile) {
        throw new VideoScoutingServiceError(404, "scouting_profile_not_found", "Scouting profile not found");
    }
    return profile;
});
const editorialPublishRequiredFields = [
    "playerProfileId",
    "title",
    "sportType",
    "playType",
    "tournamentType",
    "tournamentName",
    "recordedAt",
];
const ensurePublishedProfileHasMinimumEditorialData = (payload) => {
    const missingFields = editorialPublishRequiredFields.filter((field) => {
        const value = payload[field];
        if (Array.isArray(value))
            return value.length === 0;
        return value === null || value === undefined || String(value).trim() === "";
    });
    if (missingFields.length > 0) {
        throw new VideoScoutingServiceError(400, "incomplete_published_scouting_profile", `Published scouting profiles require: ${missingFields.join(", ")}`);
    }
};
const ensureLibraryVideoExists = (videoId) => __awaiter(void 0, void 0, void 0, function* () {
    const objectId = toObjectId(videoId, "videoId");
    const video = yield Video_1.default.findOne({ _id: objectId, videoType: "library" }).lean();
    if (!video) {
        throw new VideoScoutingServiceError(404, "video_not_found", "Library video not found");
    }
    return video;
});
const roleCanEditScouting = (role) => {
    const normalized = (role || "").toLowerCase();
    return normalized === "admin" || normalized === "recruiter" || normalized === "user";
};
const roleCanManageScouting = (role) => {
    const normalized = (role || "").toLowerCase();
    return normalized === "admin" || normalized === "recruiter";
};
const ensureScoutingOwnership = (video, playerProfileId, authUser) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(authUser === null || authUser === void 0 ? void 0 : authUser.id)) {
        throw new VideoScoutingServiceError(401, "unauthorized", "Authentication is required");
    }
    if (roleCanManageScouting(authUser.role)) {
        return;
    }
    const playerProfile = yield getPlayerProfileForScouting(playerProfileId);
    const ownsVideo = String(video.ownerUserId || "") === authUser.id;
    const ownsProfile = String(playerProfile.userId || "") === authUser.id;
    if (!ownsVideo || !ownsProfile) {
        throw new VideoScoutingServiceError(403, "forbidden", "Users can only manage scouting profiles for their own linked videos and player profile");
    }
});
const getVoteSummary = (videoId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const rows = yield VideoVote_1.default.aggregate([
        { $match: { videoId } },
        {
            $group: {
                _id: null,
                upvotes: { $sum: { $cond: [{ $eq: ["$value", 1] }, 1, 0] } },
                downvotes: { $sum: { $cond: [{ $eq: ["$value", -1] }, 1, 0] } },
            },
        },
    ]);
    const upvotes = ((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.upvotes) || 0;
    const downvotes = ((_b = rows[0]) === null || _b === void 0 ? void 0 : _b.downvotes) || 0;
    const netVotes = upvotes - downvotes;
    return {
        upvotes,
        downvotes,
        netVotes,
    };
});
const getMyVote = (videoId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId || !isObjectId(userId))
        return null;
    const vote = yield VideoVote_1.default.findOne({ videoId, userId: new mongoose_1.default.Types.ObjectId(userId) })
        .select({ value: 1 })
        .lean();
    return (vote === null || vote === void 0 ? void 0 : vote.value) || null;
});
const completenessFields = [
    "title",
    "sportType",
    "playType",
    "tournamentType",
    "playerName",
    "playerAge",
    "playerPosition",
    "playerTeam",
    "playerCategory",
    "jerseyNumber",
    "dominantProfile",
    "country",
    "city",
    "tournamentName",
    "tags",
    "recordedAt",
];
const computeRankingScore = (input) => {
    var _a;
    const baseScore = input.netVotes * 10 + input.upvotes * 2 - input.downvotes;
    const profile = input.scoutingProfile || null;
    let completenessRatio = 0;
    if (profile) {
        const completed = completenessFields.reduce((acc, field) => {
            const value = profile[field];
            const hasValue = Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && String(value).trim() !== "";
            return acc + (hasValue ? 1 : 0);
        }, 0);
        completenessRatio = completed / completenessFields.length;
    }
    const completenessBonus = Math.round(completenessRatio * 12);
    const referenceDate = (profile === null || profile === void 0 ? void 0 : profile.recordedAt) || ((_a = input.video) === null || _a === void 0 ? void 0 : _a.uploadedAt);
    let freshnessBonus = 0;
    if (referenceDate) {
        const days = Math.max(0, Math.floor((Date.now() - new Date(referenceDate).getTime()) / (1000 * 60 * 60 * 24)));
        freshnessBonus = Math.max(0, 6 - Math.floor(days / 30));
    }
    return baseScore + completenessBonus + freshnessBonus;
};
const toVideoSummary = (video) => ({
    _id: video._id,
    s3Key: video.s3Key,
    sportType: video.sportType,
    uploadedAt: video.uploadedAt,
    ownerUserId: video.ownerUserId || null,
    videoUrl: video.s3Key ? (0, s3FilesService_1.getObjectS3SignedUrl)(video.s3Key) : undefined,
});
const mapScoutingProfile = (profile) => {
    if (!profile)
        return null;
    return {
        _id: profile._id,
        videoId: profile.videoId,
        playerProfileId: profile.playerProfileId || null,
        publicationStatus: profile.publicationStatus || "published",
        title: profile.title,
        sportType: profile.sportType,
        playType: profile.playType,
        tournamentType: profile.tournamentType,
        playerName: profile.playerName,
        playerAge: profile.playerAge,
        playerPosition: profile.playerPosition,
        playerTeam: profile.playerTeam,
        playerCategory: profile.playerCategory,
        jerseyNumber: profile.jerseyNumber,
        dominantProfile: profile.dominantProfile,
        country: profile.country,
        city: profile.city,
        tournamentName: profile.tournamentName,
        notes: profile.notes,
        tags: profile.tags || [],
        recordedAt: profile.recordedAt,
        createdBy: profile.createdBy,
        updatedBy: profile.updatedBy,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
    };
};
const mapPlayerProfileSummary = (profile) => {
    if (!profile)
        return null;
    return {
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
    };
};
const getPlayerProfileByVideoIdMap = (videoIds) => __awaiter(void 0, void 0, void 0, function* () {
    if (videoIds.length === 0)
        return new Map();
    const objectIds = videoIds
        .filter((videoId) => isObjectId(videoId))
        .map((videoId) => new mongoose_1.default.Types.ObjectId(videoId));
    if (objectIds.length === 0)
        return new Map();
    const links = yield PlayerProfileVideoLink_1.default.find({ videoId: { $in: objectIds } })
        .select({ videoId: 1, playerProfileId: 1 })
        .lean();
    if (links.length === 0)
        return new Map();
    const profileIds = [...new Set(links.map((item) => String(item.playerProfileId)))].map((profileId) => new mongoose_1.default.Types.ObjectId(profileId));
    const profiles = yield PlayerProfile_1.default.find({ _id: { $in: profileIds } })
        .select({
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
    })
        .lean();
    const profileById = new Map(profiles.map((item) => [String(item._id), item]));
    const entries = links
        .map((link) => [
        String(link.videoId),
        mapPlayerProfileSummary(profileById.get(String(link.playerProfileId))),
    ])
        .filter((entry) => Boolean(entry[1]));
    return new Map(entries);
});
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const createVideoScoutingProfile = (videoId, payload, authUser) => __awaiter(void 0, void 0, void 0, function* () {
    if (!roleCanEditScouting(authUser === null || authUser === void 0 ? void 0 : authUser.role)) {
        throw new VideoScoutingServiceError(403, "forbidden", "Insufficient permissions to create scouting profile");
    }
    const parsed = parseZod(videoScoutingContracts_1.createScoutingProfileSchema.safeParse(payload), "invalid_scouting_profile_payload");
    const video = yield ensureLibraryVideoExists(videoId);
    const videoObjectId = new mongoose_1.default.Types.ObjectId(String(video._id));
    const existing = yield VideoScoutingProfile_1.default.findOne({ videoId: videoObjectId }).lean();
    if (existing) {
        throw new VideoScoutingServiceError(409, "scouting_profile_already_exists", "Scouting profile already exists for this video");
    }
    const createdBy = (authUser === null || authUser === void 0 ? void 0 : authUser.id) && isObjectId(authUser.id) ? new mongoose_1.default.Types.ObjectId(authUser.id) : undefined;
    const linkedPlayerProfileId = yield getLinkedPlayerProfileForVideo(videoObjectId, parsed.playerProfileId);
    yield ensureScoutingOwnership(video, linkedPlayerProfileId, authUser);
    const createData = yield hydrateScoutingPayloadFromPlayerProfile(parsed, linkedPlayerProfileId);
    const publicationStatus = createData.publicationStatus || "published";
    if (publicationStatus === "published") {
        ensurePublishedProfileHasMinimumEditorialData(createData);
    }
    const created = yield VideoScoutingProfile_1.default.create(Object.assign(Object.assign({ videoId: videoObjectId, publicationStatus }, createData), { createdBy, updatedBy: createdBy }));
    return {
        video: toVideoSummary(video),
        scoutingProfile: mapScoutingProfile(created.toObject()),
    };
});
exports.createVideoScoutingProfile = createVideoScoutingProfile;
const getVideoScoutingProfile = (videoId) => __awaiter(void 0, void 0, void 0, function* () {
    const video = yield ensureLibraryVideoExists(videoId);
    const profile = yield VideoScoutingProfile_1.default.findOne({ videoId: video._id }).lean();
    if (!profile) {
        throw new VideoScoutingServiceError(404, "scouting_profile_not_found", "Scouting profile not found");
    }
    return {
        video: toVideoSummary(video),
        scoutingProfile: mapScoutingProfile(profile),
    };
});
exports.getVideoScoutingProfile = getVideoScoutingProfile;
const updateVideoScoutingProfile = (videoId, payload, authUser) => __awaiter(void 0, void 0, void 0, function* () {
    if (!roleCanEditScouting(authUser === null || authUser === void 0 ? void 0 : authUser.role)) {
        throw new VideoScoutingServiceError(403, "forbidden", "Insufficient permissions to update scouting profile");
    }
    const parsed = parseZod(videoScoutingContracts_1.updateScoutingProfileSchema.safeParse(payload), "invalid_scouting_profile_payload");
    const video = yield ensureLibraryVideoExists(videoId);
    const videoObjectId = toObjectId(videoId, "videoId");
    const existingProfile = yield getExistingScoutingProfileOrThrow(videoObjectId);
    const effectivePlayerProfileId = parsed.playerProfileId || String(existingProfile.playerProfileId || "");
    if (!effectivePlayerProfileId) {
        throw new VideoScoutingServiceError(409, "scouting_profile_missing_player_profile", "Scouting profile must be associated with a player profile");
    }
    const linkedPlayerProfileId = yield getLinkedPlayerProfileForVideo(videoObjectId, effectivePlayerProfileId);
    yield ensureScoutingOwnership(video, linkedPlayerProfileId, authUser);
    const updateData = yield hydrateScoutingPayloadFromPlayerProfile(parsed, linkedPlayerProfileId);
    const updatedBy = (authUser === null || authUser === void 0 ? void 0 : authUser.id) && isObjectId(authUser.id) ? new mongoose_1.default.Types.ObjectId(authUser.id) : undefined;
    if (updatedBy) {
        updateData.updatedBy = updatedBy;
    }
    const nextPublicationStatus = (updateData.publicationStatus ||
        existingProfile.publicationStatus ||
        "published");
    const nextProfileState = Object.assign(Object.assign(Object.assign({}, existingProfile), updateData), { publicationStatus: nextPublicationStatus, playerProfileId: linkedPlayerProfileId });
    if (nextPublicationStatus === "published") {
        ensurePublishedProfileHasMinimumEditorialData(nextProfileState);
    }
    const updated = yield VideoScoutingProfile_1.default.findOneAndUpdate({ videoId: videoObjectId }, { $set: updateData }, { new: true }).lean();
    return {
        scoutingProfile: mapScoutingProfile(updated || nextProfileState),
    };
});
exports.updateVideoScoutingProfile = updateVideoScoutingProfile;
const upsertVideoVote = (videoId, payload, authUser) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(authUser === null || authUser === void 0 ? void 0 : authUser.id)) {
        throw new VideoScoutingServiceError(401, "unauthorized", "Authentication is required");
    }
    const parsed = parseZod(videoScoutingContracts_1.upsertVideoVoteSchema.safeParse(payload), "invalid_vote_payload");
    yield ensureLibraryVideoExists(videoId);
    const videoObjectId = toObjectId(videoId, "videoId");
    const userObjectId = toObjectId(authUser.id, "userId");
    let currentVote = null;
    if (parsed.value === 0) {
        yield VideoVote_1.default.findOneAndDelete({ videoId: videoObjectId, userId: userObjectId });
    }
    else {
        const vote = yield VideoVote_1.default.findOneAndUpdate({ videoId: videoObjectId, userId: userObjectId }, { $set: { value: parsed.value } }, { new: true, upsert: true, setDefaultsOnInsert: true }).lean();
        currentVote = (vote === null || vote === void 0 ? void 0 : vote.value) || null;
    }
    const summary = yield (0, exports.getVideoVoteSummary)(videoId, authUser.id);
    return {
        vote: {
            videoId,
            userId: authUser.id,
            value: currentVote,
        },
        summary,
    };
});
exports.upsertVideoVote = upsertVideoVote;
const deleteVideoVoteByUser = (videoId, userId, authUser) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(authUser === null || authUser === void 0 ? void 0 : authUser.id)) {
        throw new VideoScoutingServiceError(401, "unauthorized", "Authentication is required");
    }
    const sameUser = authUser.id === userId;
    const isPrivileged = roleCanManageScouting(authUser.role);
    if (!sameUser && !isPrivileged) {
        throw new VideoScoutingServiceError(403, "forbidden", "Insufficient permissions to delete this vote");
    }
    yield ensureLibraryVideoExists(videoId);
    const videoObjectId = toObjectId(videoId, "videoId");
    const userObjectId = toObjectId(userId, "userId");
    yield VideoVote_1.default.findOneAndDelete({ videoId: videoObjectId, userId: userObjectId });
    const summary = yield (0, exports.getVideoVoteSummary)(videoId, authUser.id);
    return {
        message: "Vote deleted successfully",
        summary,
    };
});
exports.deleteVideoVoteByUser = deleteVideoVoteByUser;
const getVideoVoteSummary = (videoId, currentUserId) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureLibraryVideoExists(videoId);
    const videoObjectId = toObjectId(videoId, "videoId");
    const votes = yield getVoteSummary(videoObjectId);
    const profile = yield VideoScoutingProfile_1.default.findOne({ videoId: videoObjectId }).lean();
    const video = yield Video_1.default.findById(videoObjectId).lean();
    const score = computeRankingScore(Object.assign(Object.assign({}, votes), { scoutingProfile: profile, video }));
    return {
        videoId,
        upvotes: votes.upvotes,
        downvotes: votes.downvotes,
        netVotes: votes.netVotes,
        score,
        myVote: yield getMyVote(videoObjectId, currentUserId),
    };
});
exports.getVideoVoteSummary = getVideoVoteSummary;
const buildRankingFilterStages = (query) => {
    const profileFilters = {};
    if (query.sportType)
        profileFilters["scoutingProfile.sportType"] = query.sportType;
    if (query.playType)
        profileFilters["scoutingProfile.playType"] = query.playType;
    if (query.country)
        profileFilters["scoutingProfile.country"] = query.country;
    if (query.city)
        profileFilters["scoutingProfile.city"] = query.city;
    if (query.tournamentType)
        profileFilters["scoutingProfile.tournamentType"] = query.tournamentType;
    if (query.playerPosition)
        profileFilters["scoutingProfile.playerPosition"] = query.playerPosition;
    if (query.playerCategory)
        profileFilters["scoutingProfile.playerCategory"] = query.playerCategory;
    if (query.tournamentName)
        profileFilters["scoutingProfile.tournamentName"] = query.tournamentName;
    const searchTerm = query.searchTerm;
    const searchFilters = typeof searchTerm === "string" && searchTerm.trim()
        ? {
            $or: [
                { s3Key: { $regex: escapeRegex(searchTerm.trim()), $options: "i" } },
                { "scoutingProfile.title": { $regex: escapeRegex(searchTerm.trim()), $options: "i" } },
                { "scoutingProfile.playerName": { $regex: escapeRegex(searchTerm.trim()), $options: "i" } },
                { "scoutingProfile.playerTeam": { $regex: escapeRegex(searchTerm.trim()), $options: "i" } },
                {
                    "scoutingProfile.tournamentName": {
                        $regex: escapeRegex(searchTerm.trim()),
                        $options: "i",
                    },
                },
            ],
        }
        : null;
    const matchStages = [];
    if (Object.keys(profileFilters).length > 0) {
        matchStages.push({ $match: profileFilters });
    }
    if (searchFilters) {
        matchStages.push({ $match: searchFilters });
    }
    matchStages.push({
        $match: {
            scoutingProfile: { $ne: null },
            "scoutingProfile.publicationStatus": { $in: [null, "published"] },
        },
    });
    return matchStages;
};
const aggregateRankingsCandidates = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const pipeline = [
        { $match: { videoType: "library" } },
        {
            $lookup: {
                from: "video_scouting_profiles",
                localField: "_id",
                foreignField: "videoId",
                as: "scoutingProfile",
            },
        },
        { $unwind: { path: "$scoutingProfile", preserveNullAndEmptyArrays: true } },
        ...buildRankingFilterStages(query),
        {
            $lookup: {
                from: "video_votes",
                let: { videoId: "$_id" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$videoId", "$$videoId"] } } },
                    {
                        $group: {
                            _id: null,
                            upvotes: { $sum: { $cond: [{ $eq: ["$value", 1] }, 1, 0] } },
                            downvotes: { $sum: { $cond: [{ $eq: ["$value", -1] }, 1, 0] } },
                        },
                    },
                ],
                as: "voteAgg",
            },
        },
        {
            $addFields: {
                voteAgg: {
                    $ifNull: [
                        { $arrayElemAt: ["$voteAgg", 0] },
                        { upvotes: 0, downvotes: 0 },
                    ],
                },
            },
        },
        {
            $project: {
                _id: 1,
                s3Key: 1,
                sportType: 1,
                uploadedAt: 1,
                ownerUserId: 1,
                scoutingProfile: 1,
                upvotes: "$voteAgg.upvotes",
                downvotes: "$voteAgg.downvotes",
            },
        },
    ];
    return Video_1.default.aggregate(pipeline);
});
const mapRankingItem = (row, playerProfile) => {
    const upvotes = row.upvotes || 0;
    const downvotes = row.downvotes || 0;
    const netVotes = upvotes - downvotes;
    const score = computeRankingScore({
        upvotes,
        downvotes,
        netVotes,
        scoutingProfile: row.scoutingProfile,
        video: row,
    });
    return {
        video: {
            _id: row._id,
            s3Key: row.s3Key,
            sportType: row.sportType,
            uploadedAt: row.uploadedAt,
            ownerUserId: row.ownerUserId || null,
            videoUrl: row.s3Key ? (0, s3FilesService_1.getObjectS3SignedUrl)(row.s3Key) : undefined,
        },
        scoutingProfile: mapScoutingProfile(row.scoutingProfile),
        playerProfile: mapPlayerProfileSummary(playerProfile),
        ranking: {
            score,
            upvotes,
            downvotes,
            netVotes,
        },
    };
};
const isPublishedScoutingProfile = (profile) => {
    if (!profile)
        return false;
    return !profile.publicationStatus || profile.publicationStatus === "published";
};
const shouldIncludeRankingRow = (row) => Boolean(row.scoutingProfile && isPublishedScoutingProfile(row.scoutingProfile));
const getVideoUploadedAtTimestamp = (item) => { var _a; return new Date(((_a = item === null || item === void 0 ? void 0 : item.video) === null || _a === void 0 ? void 0 : _a.uploadedAt) || 0).getTime(); };
const compareRankingItemsByRecent = (a, b) => {
    var _a, _b;
    const uploadedAtDiff = getVideoUploadedAtTimestamp(b) - getVideoUploadedAtTimestamp(a);
    if (uploadedAtDiff !== 0)
        return uploadedAtDiff;
    return String(((_a = b === null || b === void 0 ? void 0 : b.video) === null || _a === void 0 ? void 0 : _a._id) || "").localeCompare(String(((_b = a === null || a === void 0 ? void 0 : a.video) === null || _b === void 0 ? void 0 : _b._id) || ""));
};
const compareRankingItems = (sortBy, a, b) => {
    if (sortBy === "recent") {
        return compareRankingItemsByRecent(a, b);
    }
    if (sortBy === "upvotes") {
        const upvotesDiff = b.ranking.upvotes - a.ranking.upvotes;
        if (upvotesDiff !== 0)
            return upvotesDiff;
        return compareRankingItemsByRecent(a, b);
    }
    const scoreDiff = b.ranking.score - a.ranking.score;
    if (scoreDiff !== 0)
        return scoreDiff;
    return compareRankingItemsByRecent(a, b);
};
const getVideoLibraryRankings = (query, currentUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = parseZod(videoScoutingContracts_1.rankingsQuerySchema.safeParse(query), "invalid_rankings_query");
    const rows = yield aggregateRankingsCandidates(parsed);
    const visibleRows = rows.filter((row) => shouldIncludeRankingRow(row));
    const playerProfileByVideoId = yield getPlayerProfileByVideoIdMap(visibleRows.map((row) => String(row._id)));
    const mapped = visibleRows.map((row) => mapRankingItem(row, playerProfileByVideoId.get(String(row._id))));
    mapped.sort((a, b) => compareRankingItems(parsed.sortBy, a, b));
    const page = parsed.page;
    const limit = parsed.limit;
    const total = mapped.length;
    const start = (page - 1) * limit;
    const items = mapped.slice(start, start + limit);
    const myVotesByVideoId = new Map();
    if (currentUserId && isObjectId(currentUserId) && items.length > 0) {
        const rowsVotes = yield VideoVote_1.default.find({
            videoId: { $in: items.map((item) => new mongoose_1.default.Types.ObjectId(item.video._id)) },
            userId: new mongoose_1.default.Types.ObjectId(currentUserId),
        })
            .select({ videoId: 1, value: 1 })
            .lean();
        rowsVotes.forEach((vote) => {
            myVotesByVideoId.set(String(vote.videoId), vote.value);
        });
    }
    return {
        items: items.map((item) => (Object.assign(Object.assign({}, item), { myVote: myVotesByVideoId.get(String(item.video._id)) || null }))),
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
exports.getVideoLibraryRankings = getVideoLibraryRankings;
const getTopVideoLibraryRankings = (query, currentUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = parseZod(videoScoutingContracts_1.topRankingsQuerySchema.safeParse(query), "invalid_top_rankings_query");
    const rows = yield aggregateRankingsCandidates(parsed);
    const visibleRows = rows.filter((row) => shouldIncludeRankingRow(row));
    const playerProfileByVideoId = yield getPlayerProfileByVideoIdMap(visibleRows.map((row) => String(row._id)));
    const top = visibleRows
        .map((row) => mapRankingItem(row, playerProfileByVideoId.get(String(row._id))))
        .sort((a, b) => b.ranking.score - a.ranking.score)
        .slice(0, parsed.limit);
    const myVotesByVideoId = new Map();
    if (currentUserId && isObjectId(currentUserId) && top.length > 0) {
        const rowsVotes = yield VideoVote_1.default.find({
            videoId: { $in: top.map((item) => new mongoose_1.default.Types.ObjectId(item.video._id)) },
            userId: new mongoose_1.default.Types.ObjectId(currentUserId),
        })
            .select({ videoId: 1, value: 1 })
            .lean();
        rowsVotes.forEach((vote) => {
            myVotesByVideoId.set(String(vote.videoId), vote.value);
        });
    }
    return top.map((item) => (Object.assign(Object.assign({}, item), { myVote: myVotesByVideoId.get(String(item.video._id)) || null })));
});
exports.getTopVideoLibraryRankings = getTopVideoLibraryRankings;
const sortTextArray = (value) => [...new Set(value.filter((item) => Boolean(item && item.trim())).map((item) => item.trim()))].sort((a, b) => a.localeCompare(b));
const getVideoLibraryFiltersCatalog = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const profileRows = yield VideoScoutingProfile_1.default.aggregate([
        {
            $group: {
                _id: null,
                sportTypes: { $addToSet: "$sportType" },
                playTypes: { $addToSet: "$playType" },
                tournamentTypes: { $addToSet: "$tournamentType" },
                countries: { $addToSet: "$country" },
                cities: { $addToSet: "$city" },
                playerPositions: { $addToSet: "$playerPosition" },
                playerCategories: { $addToSet: "$playerCategory" },
                tournaments: { $addToSet: "$tournamentName" },
            },
        },
    ]);
    const tagsRows = yield VideoScoutingProfile_1.default.aggregate([
        { $unwind: { path: "$tags", preserveNullAndEmptyArrays: false } },
        { $group: { _id: null, tags: { $addToSet: "$tags" } } },
    ]);
    const values = profileRows[0] || {};
    return {
        sportTypes: [...sportTypes_1.SPORT_TYPES],
        playTypes: sortTextArray(values.playTypes || []),
        tournamentTypes: sortTextArray(values.tournamentTypes || []),
        countries: sortTextArray(values.countries || []),
        cities: sortTextArray(values.cities || []),
        playerPositions: sortTextArray(values.playerPositions || []),
        playerCategories: sortTextArray(values.playerCategories || []),
        tournaments: sortTextArray(values.tournaments || []),
        tags: sortTextArray(((_a = tagsRows[0]) === null || _a === void 0 ? void 0 : _a.tags) || []),
    };
});
exports.getVideoLibraryFiltersCatalog = getVideoLibraryFiltersCatalog;
const getVideoRecruiterView = (videoId, currentUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const video = yield ensureLibraryVideoExists(videoId);
    const videoObjectId = new mongoose_1.default.Types.ObjectId(String(video._id));
    const profile = yield VideoScoutingProfile_1.default.findOne({ videoId: videoObjectId }).lean();
    const ranking = yield (0, exports.getVideoVoteSummary)(videoId, currentUserId);
    const playerProfileByVideoId = yield getPlayerProfileByVideoIdMap([String(video._id)]);
    const playerProfile = playerProfileByVideoId.get(String(video._id)) || null;
    let relatedVideos = [];
    if (profile) {
        const relatedProfiles = yield VideoScoutingProfile_1.default.find({
            _id: { $ne: profile._id },
            $or: [
                { sportType: profile.sportType },
                { playerCategory: profile.playerCategory },
            ],
        })
            .sort({ updatedAt: -1 })
            .limit(6)
            .lean();
        const relatedVideoIds = relatedProfiles.map((item) => item.videoId);
        const relatedBaseVideos = yield Video_1.default.find({ _id: { $in: relatedVideoIds }, videoType: "library" })
            .select({ _id: 1, s3Key: 1, uploadedAt: 1, sportType: 1, ownerUserId: 1 })
            .lean();
        const relatedPlayerProfileByVideoId = yield getPlayerProfileByVideoIdMap(relatedBaseVideos.map((item) => String(item._id)));
        const baseVideoById = new Map(relatedBaseVideos.map((item) => [String(item._id), item]));
        relatedVideos = yield Promise.all(relatedProfiles
            .map((relatedProfile) => {
            const relatedVideo = baseVideoById.get(String(relatedProfile.videoId));
            if (!relatedVideo)
                return null;
            return {
                video: toVideoSummary(relatedVideo),
                scoutingProfile: mapScoutingProfile(relatedProfile),
                playerProfile: relatedPlayerProfileByVideoId.get(String(relatedVideo._id)) || null,
            };
        })
            .filter(Boolean));
    }
    return {
        video: toVideoSummary(video),
        scoutingProfile: mapScoutingProfile(profile),
        playerProfile,
        ranking,
        relatedVideos,
    };
});
exports.getVideoRecruiterView = getVideoRecruiterView;
//# sourceMappingURL=videoScoutingService.js.map