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
exports.deleteVideoStats = exports.updateVideoStats = exports.getVideoStatsByVideoId = exports.createVideoStats = exports.calculateStatsFromEvents = exports.VideoStatsServiceError = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const VideoStats_1 = __importDefault(require("../models/VideoStats"));
const Video_1 = __importDefault(require("../models/Video"));
class VideoStatsServiceError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.VideoStatsServiceError = VideoStatsServiceError;
const SPORT_TYPES = ["football", "padel", "tennis", "basketball", "other"];
const EVENT_TYPES = ["pass", "shot", "goal", "foul", "other"];
const TEAM_KEYS = ["A", "B"];
const emptyMetric = () => ({ total: 0, teamA: 0, teamB: 0 });
const safeTrim = (value) => (typeof value === "string" ? value.trim() : "");
const isValidSportType = (value) => SPORT_TYPES.includes(value);
const buildResponse = (stats) => {
    const result = (stats === null || stats === void 0 ? void 0 : stats.toObject) ? stats.toObject() : stats;
    return Object.assign(Object.assign({}, result), { statistics: {
            sportType: result.sportType,
            teams: result.teams || [],
            summary: result.summary || "",
            matchStats: result.matchStats,
            events: result.events || [],
            teamAName: result.teamAName,
            teamBName: result.teamBName,
        } });
};
const normalizeFromLegacyOrUnified = (payload) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const normalized = {
        videoId: payload.videoId,
        sportType: (payload.sportType || ((_a = payload.statistics) === null || _a === void 0 ? void 0 : _a.sportType)),
        teamAName: safeTrim(payload.teamAName || ((_b = payload.statistics) === null || _b === void 0 ? void 0 : _b.teamAName)),
        teamBName: safeTrim(payload.teamBName || ((_c = payload.statistics) === null || _c === void 0 ? void 0 : _c.teamBName)),
        events: (payload.events || ((_d = payload.statistics) === null || _d === void 0 ? void 0 : _d.events) || []),
        teams: payload.teams ||
            ((_e = payload.statistics) === null || _e === void 0 ? void 0 : _e.teams) ||
            [],
        matchStats: (payload.matchStats || ((_f = payload.statistics) === null || _f === void 0 ? void 0 : _f.matchStats)),
        summary: payload.summary || ((_g = payload.statistics) === null || _g === void 0 ? void 0 : _g.summary) || "",
        generatedByModel: payload.generatedByModel || "manual",
    };
    return normalized;
};
const validateEvents = (events) => {
    if (!Array.isArray(events)) {
        throw new VideoStatsServiceError(400, "invalid_events", "events must be an array");
    }
    events.forEach((event, index) => {
        if (!event.id || typeof event.id !== "string") {
            throw new VideoStatsServiceError(400, "invalid_event_id", `events[${index}].id is required`);
        }
        if (typeof event.time !== "number" || Number.isNaN(event.time) || event.time < 0) {
            throw new VideoStatsServiceError(400, "invalid_event_time", `events[${index}].time must be a number >= 0`);
        }
        if (!EVENT_TYPES.includes(event.type)) {
            throw new VideoStatsServiceError(400, "invalid_event_type", `events[${index}].type is invalid`);
        }
        if (!TEAM_KEYS.includes(event.team)) {
            throw new VideoStatsServiceError(400, "invalid_event_team", `events[${index}].team must be A or B`);
        }
        if (event.note !== undefined && (typeof event.note !== "string" || event.note.length > 500)) {
            throw new VideoStatsServiceError(400, "invalid_event_note", `events[${index}].note must be <= 500 chars`);
        }
    });
};
const calculateStatsFromEvents = (events) => {
    const stats = {
        passes: emptyMetric(),
        shots: emptyMetric(),
        goals: emptyMetric(),
        fouls: emptyMetric(),
        others: emptyMetric(),
    };
    const add = (metric, team) => {
        metric.total += 1;
        if (team === "A")
            metric.teamA += 1;
        if (team === "B")
            metric.teamB += 1;
    };
    events.forEach((event) => {
        if (event.type === "pass")
            add(stats.passes, event.team);
        if (event.type === "shot")
            add(stats.shots, event.team);
        if (event.type === "goal") {
            add(stats.goals, event.team);
            // Rule: each goal is also a shot.
            add(stats.shots, event.team);
        }
        if (event.type === "foul")
            add(stats.fouls, event.team);
        if (event.type === "other")
            add(stats.others, event.team);
    });
    return stats;
};
exports.calculateStatsFromEvents = calculateStatsFromEvents;
const deriveMatchStatsFromTeams = (teams) => {
    var _a, _b;
    const safe = (value) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
    const a = ((_a = teams[0]) === null || _a === void 0 ? void 0 : _a.stats) || {};
    const b = ((_b = teams[1]) === null || _b === void 0 ? void 0 : _b.stats) || {};
    const passesA = safe(a.passes);
    const passesB = safe(b.passes);
    const shotsA = safe(a.shots);
    const shotsB = safe(b.shots);
    const goalsA = safe(a.goals);
    const goalsB = safe(b.goals);
    const foulsA = safe(a.fouls);
    const foulsB = safe(b.fouls);
    const othersA = safe(a.others);
    const othersB = safe(b.others);
    return {
        passes: { total: passesA + passesB, teamA: passesA, teamB: passesB },
        shots: { total: shotsA + shotsB, teamA: shotsA, teamB: shotsB },
        goals: { total: goalsA + goalsB, teamA: goalsA, teamB: goalsB },
        fouls: { total: foulsA + foulsB, teamA: foulsA, teamB: foulsB },
        others: { total: othersA + othersB, teamA: othersA, teamB: othersB },
    };
};
const buildTeamsFromEventStats = (teamAName, teamBName, calculated) => [
    {
        teamKey: "A",
        teamName: teamAName,
        stats: {
            passes: calculated.passes.teamA,
            shots: calculated.shots.teamA,
            goals: calculated.goals.teamA,
            fouls: calculated.fouls.teamA,
            others: calculated.others.teamA,
        },
    },
    {
        teamKey: "B",
        teamName: teamBName,
        stats: {
            passes: calculated.passes.teamB,
            shots: calculated.shots.teamB,
            goals: calculated.goals.teamB,
            fouls: calculated.fouls.teamB,
            others: calculated.others.teamB,
        },
    },
];
const ensureValidBase = (videoId, sportType) => {
    if (!videoId || !mongoose_1.default.Types.ObjectId.isValid(videoId)) {
        throw new VideoStatsServiceError(400, "invalid_video_id", "videoId is required and must be valid");
    }
    if (!sportType || !isValidSportType(sportType)) {
        throw new VideoStatsServiceError(400, "invalid_sport_type", "sportType is required and invalid");
    }
};
const buildUpsertDocument = (payload) => {
    var _a, _b;
    const normalized = normalizeFromLegacyOrUnified(payload);
    ensureValidBase(normalized.videoId, normalized.sportType);
    const hasEvents = Array.isArray(normalized.events);
    const events = hasEvents ? normalized.events : [];
    if (hasEvents)
        validateEvents(events);
    let matchStats = normalized.matchStats;
    let teams = normalized.teams || [];
    const teamAName = normalized.teamAName || ((_a = teams[0]) === null || _a === void 0 ? void 0 : _a.teamName) || "Team A";
    const teamBName = normalized.teamBName || ((_b = teams[1]) === null || _b === void 0 ? void 0 : _b.teamName) || "Team B";
    if (events.length >= 0 && (normalized.teamAName || normalized.teamBName || events.length > 0)) {
        // If events are present in the request path (manual mode), always recalculate.
        if (events.length > 0 || normalized.generatedByModel === "manual") {
            const calculated = (0, exports.calculateStatsFromEvents)(events);
            matchStats = calculated;
            teams = buildTeamsFromEventStats(teamAName, teamBName, calculated);
        }
    }
    if (!matchStats && teams.length > 0) {
        matchStats = deriveMatchStatsFromTeams(teams);
    }
    return {
        videoId: normalized.videoId,
        sportType: normalized.sportType,
        teamAName,
        teamBName,
        teams,
        matchStats,
        events: events.length ? events : undefined,
        summary: normalized.summary || "",
        generatedByModel: normalized.generatedByModel || "manual",
    };
};
const ensureVideoExistsAndSyncSportType = (videoId, sportType) => __awaiter(void 0, void 0, void 0, function* () {
    const exists = yield Video_1.default.exists({ _id: videoId });
    if (!exists) {
        throw new VideoStatsServiceError(404, "video_not_found", "Video not found");
    }
    yield Video_1.default.findByIdAndUpdate(videoId, { sportType });
});
const createVideoStats = (statsData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const upsertDoc = buildUpsertDocument(statsData);
        yield ensureVideoExistsAndSyncSportType(upsertDoc.videoId, upsertDoc.sportType);
        const created = yield VideoStats_1.default.findOneAndUpdate({ videoId: upsertDoc.videoId }, upsertDoc, { new: true, upsert: true, setDefaultsOnInsert: true });
        return buildResponse(created);
    }
    catch (error) {
        if (error instanceof VideoStatsServiceError)
            throw error;
        throw new Error(`Error creating video stats: ${error.message}`);
    }
});
exports.createVideoStats = createVideoStats;
const getVideoStatsByVideoId = (videoId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!videoId || !mongoose_1.default.Types.ObjectId.isValid(videoId)) {
            throw new VideoStatsServiceError(400, "invalid_video_id", "videoId is required and must be valid");
        }
        const stats = yield VideoStats_1.default.findOne({ videoId });
        if (!stats) {
            throw new VideoStatsServiceError(404, "stats_not_found", "Stats not found for this video");
        }
        return buildResponse(stats);
    }
    catch (error) {
        if (error instanceof VideoStatsServiceError)
            throw error;
        throw new Error(`Error fetching video stats: ${error.message}`);
    }
});
exports.getVideoStatsByVideoId = getVideoStatsByVideoId;
const updateVideoStats = (videoId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const upsertDoc = buildUpsertDocument(Object.assign(Object.assign({}, updateData), { videoId }));
        yield ensureVideoExistsAndSyncSportType(upsertDoc.videoId, upsertDoc.sportType);
        const updated = yield VideoStats_1.default.findOneAndUpdate({ videoId }, upsertDoc, {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
        });
        return buildResponse(updated);
    }
    catch (error) {
        if (error instanceof VideoStatsServiceError)
            throw error;
        throw new Error(`Error updating video stats: ${error.message}`);
    }
});
exports.updateVideoStats = updateVideoStats;
const deleteVideoStats = (videoId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!videoId || !mongoose_1.default.Types.ObjectId.isValid(videoId)) {
            throw new VideoStatsServiceError(400, "invalid_video_id", "videoId is required and must be valid");
        }
        const deleted = yield VideoStats_1.default.findOneAndDelete({ videoId });
        if (!deleted)
            throw new VideoStatsServiceError(404, "stats_not_found", "Stats not found to delete");
        return { message: "Video stats deleted successfully" };
    }
    catch (error) {
        if (error instanceof VideoStatsServiceError)
            throw error;
        throw new Error(`Error deleting video stats: ${error.message}`);
    }
});
exports.deleteVideoStats = deleteVideoStats;
//# sourceMappingURL=videoStatsService.js.map