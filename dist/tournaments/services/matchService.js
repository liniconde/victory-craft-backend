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
exports.generateMatchesForTournament = exports.deleteMatch = exports.updateMatch = exports.getMatchById = exports.listMatches = exports.createMatch = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Tournament_1 = __importDefault(require("../models/Tournament"));
const TournamentTeam_1 = __importDefault(require("../models/TournamentTeam"));
const TournamentMatch_1 = __importDefault(require("../models/TournamentMatch"));
const TournamentMatchStat_1 = __importDefault(require("../models/TournamentMatchStat"));
const errors_1 = require("./errors");
const utils_1 = require("./utils");
const ensureTeamsForMatch = (homeTeamId, awayTeamId) => __awaiter(void 0, void 0, void 0, function* () {
    if (homeTeamId === awayTeamId) {
        throw new errors_1.TournamentsDomainError(400, "same_team_match", "homeTeamId and awayTeamId must be different");
    }
    const [homeTeam, awayTeam] = yield Promise.all([
        TournamentTeam_1.default.findById(homeTeamId).lean(),
        TournamentTeam_1.default.findById(awayTeamId).lean(),
    ]);
    if (!homeTeam || !awayTeam) {
        throw new errors_1.TournamentsDomainError(404, "team_not_found", "One or both teams were not found");
    }
    if (String(homeTeam.tournamentId) !== String(awayTeam.tournamentId)) {
        throw new errors_1.TournamentsDomainError(400, "cross_tournament_match", "Teams must belong to the same tournament");
    }
    return { homeTeam, awayTeam };
});
const createMatch = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    (0, utils_1.assertObjectId)(payload.homeTeamId, "homeTeamId");
    (0, utils_1.assertObjectId)(payload.awayTeamId, "awayTeamId");
    if (payload.matchSessionId) {
        (0, utils_1.assertObjectId)(payload.matchSessionId, "matchSessionId");
    }
    yield ensureTeamsForMatch(payload.homeTeamId, payload.awayTeamId);
    const pairKey = (0, utils_1.buildPairKey)(payload.homeTeamId, payload.awayTeamId);
    const created = yield TournamentMatch_1.default.create({
        homeTeamId: payload.homeTeamId,
        awayTeamId: payload.awayTeamId,
        pairKey,
        scheduledAt: (0, utils_1.parseOptionalDate)(payload.scheduledAt),
        venue: (_a = payload.venue) === null || _a === void 0 ? void 0 : _a.trim(),
        round: (_b = payload.round) === null || _b === void 0 ? void 0 : _b.trim(),
        status: payload.status || "scheduled",
        matchSessionId: payload.matchSessionId,
    });
    return created.toObject();
});
exports.createMatch = createMatch;
const listMatches = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const query = {};
    if (filters === null || filters === void 0 ? void 0 : filters.teamId) {
        (0, utils_1.assertObjectId)(filters.teamId, "teamId");
        query.$or = [{ homeTeamId: filters.teamId }, { awayTeamId: filters.teamId }];
    }
    if (filters === null || filters === void 0 ? void 0 : filters.tournamentId) {
        (0, utils_1.assertObjectId)(filters.tournamentId, "tournamentId");
        const teams = yield TournamentTeam_1.default.find({ tournamentId: filters.tournamentId }, { _id: 1 }).lean();
        const teamIds = teams.map((team) => team._id);
        if (query.$or) {
            const explicitTeamId = String(filters.teamId);
            const teamExistsInTournament = teamIds.some((teamId) => String(teamId) === explicitTeamId);
            if (!teamExistsInTournament) {
                return { items: [], total: 0 };
            }
        }
        else {
            query.homeTeamId = { $in: teamIds };
            query.awayTeamId = { $in: teamIds };
        }
    }
    if ((_a = filters === null || filters === void 0 ? void 0 : filters.status) === null || _a === void 0 ? void 0 : _a.trim()) {
        query.status = filters.status.trim();
    }
    const items = yield TournamentMatch_1.default.find(query).sort({ createdAt: -1, _id: -1 }).lean();
    return { items, total: items.length };
});
exports.listMatches = listMatches;
const getMatchById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.assertObjectId)(id, "matchId");
    const match = yield TournamentMatch_1.default.findById(id).lean();
    if (!match) {
        throw new errors_1.TournamentsDomainError(404, "match_not_found", "Match not found");
    }
    return match;
});
exports.getMatchById = getMatchById;
const updateMatch = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.assertObjectId)(id, "matchId");
    if (payload.matchSessionId) {
        (0, utils_1.assertObjectId)(payload.matchSessionId, "matchSessionId");
    }
    if (payload.winnerTeamId) {
        (0, utils_1.assertObjectId)(payload.winnerTeamId, "winnerTeamId");
    }
    const match = yield TournamentMatch_1.default.findById(id);
    if (!match) {
        throw new errors_1.TournamentsDomainError(404, "match_not_found", "Match not found");
    }
    if (payload.winnerTeamId) {
        const winner = payload.winnerTeamId;
        if (winner !== String(match.homeTeamId) && winner !== String(match.awayTeamId)) {
            throw new errors_1.TournamentsDomainError(400, "invalid_winner", "winnerTeamId must belong to the match teams");
        }
    }
    if (typeof payload.scheduledAt !== "undefined") {
        match.scheduledAt = (0, utils_1.parseOptionalDate)(payload.scheduledAt);
    }
    if (typeof payload.venue === "string")
        match.venue = payload.venue.trim();
    if (typeof payload.round === "string")
        match.round = payload.round.trim();
    if (typeof payload.status === "string")
        match.status = payload.status;
    if (payload.matchSessionId)
        match.matchSessionId = new mongoose_1.default.Types.ObjectId(payload.matchSessionId);
    if (payload.score)
        match.score = payload.score;
    if (payload.winnerTeamId)
        match.winnerTeamId = new mongoose_1.default.Types.ObjectId(payload.winnerTeamId);
    yield match.save();
    return match.toObject();
});
exports.updateMatch = updateMatch;
const deleteMatch = (id) => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.assertObjectId)(id, "matchId");
    const matchObjectId = new mongoose_1.default.Types.ObjectId(id);
    const [deletedMatch, deletedStats] = yield Promise.all([
        TournamentMatch_1.default.findByIdAndDelete(matchObjectId).lean(),
        TournamentMatchStat_1.default.deleteMany({ matchId: matchObjectId }),
    ]);
    if (!deletedMatch) {
        throw new errors_1.TournamentsDomainError(404, "match_not_found", "Match not found");
    }
    return {
        message: "Match deleted successfully",
        deletedMatchId: id,
        deletedStatsCount: deletedStats.deletedCount || 0,
    };
});
exports.deleteMatch = deleteMatch;
const generateMatchesForTournament = (tournamentId) => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.assertObjectId)(tournamentId, "tournamentId");
    const tournament = yield Tournament_1.default.findById(tournamentId).lean();
    if (!tournament) {
        throw new errors_1.TournamentsDomainError(404, "tournament_not_found", "Tournament not found");
    }
    const teams = yield TournamentTeam_1.default.find({ tournamentId }).sort({ createdAt: 1, _id: 1 }).lean();
    if (teams.length < 2) {
        throw new errors_1.TournamentsDomainError(400, "insufficient_teams", "At least 2 teams are required to generate matches");
    }
    const teamIds = teams.map((team) => team._id);
    const existing = yield TournamentMatch_1.default.find({
        homeTeamId: { $in: teamIds },
        awayTeamId: { $in: teamIds },
    }, { pairKey: 1 }).lean();
    const existingPairKeys = new Set(existing.map((row) => row.pairKey));
    const docsToCreate = [];
    let roundNumber = 1;
    for (let i = 0; i < teams.length; i += 1) {
        for (let j = i + 1; j < teams.length; j += 1) {
            const homeTeam = teams[i];
            const awayTeam = teams[j];
            const pairKey = (0, utils_1.buildPairKey)(String(homeTeam._id), String(awayTeam._id));
            if (existingPairKeys.has(pairKey))
                continue;
            docsToCreate.push({
                homeTeamId: homeTeam._id,
                awayTeamId: awayTeam._id,
                pairKey,
                round: `round-${roundNumber}`,
                status: "scheduled",
            });
            roundNumber += 1;
        }
    }
    let createdCount = 0;
    if (docsToCreate.length > 0) {
        const inserted = yield TournamentMatch_1.default.insertMany(docsToCreate, { ordered: false });
        createdCount = inserted.length;
    }
    return {
        tournamentId,
        teamsCount: teams.length,
        existingMatches: existing.length,
        createdMatches: createdCount,
        totalMatchesAfterGeneration: existing.length + createdCount,
    };
});
exports.generateMatchesForTournament = generateMatchesForTournament;
//# sourceMappingURL=matchService.js.map