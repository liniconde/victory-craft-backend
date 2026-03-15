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
exports.deleteMatchStat = exports.updateMatchStat = exports.getMatchStatById = exports.listMatchStats = exports.createMatchStat = void 0;
const TournamentTeam_1 = __importDefault(require("../models/TournamentTeam"));
const TournamentMatch_1 = __importDefault(require("../models/TournamentMatch"));
const TournamentMatchStat_1 = __importDefault(require("../models/TournamentMatchStat"));
const errors_1 = require("./errors");
const utils_1 = require("./utils");
const createMatchStat = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    (0, utils_1.assertObjectId)(payload.matchId, "matchId");
    const match = yield TournamentMatch_1.default.findById(payload.matchId).lean();
    if (!match) {
        throw new errors_1.TournamentsDomainError(404, "match_not_found", "Match not found");
    }
    const created = yield TournamentMatchStat_1.default.create({
        matchId: payload.matchId,
        sport: (_a = payload.sport) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase(),
        stats: payload.stats || {},
    });
    return created.toObject();
});
exports.createMatchStat = createMatchStat;
const listMatchStats = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {};
    if (filters === null || filters === void 0 ? void 0 : filters.matchId) {
        (0, utils_1.assertObjectId)(filters.matchId, "matchId");
        query.matchId = filters.matchId;
    }
    if (filters === null || filters === void 0 ? void 0 : filters.tournamentId) {
        (0, utils_1.assertObjectId)(filters.tournamentId, "tournamentId");
        const teams = yield TournamentTeam_1.default.find({ tournamentId: filters.tournamentId }, { _id: 1 }).lean();
        const teamIds = teams.map((team) => team._id);
        if (query.matchId) {
            const match = yield TournamentMatch_1.default.findById(query.matchId, { homeTeamId: 1, awayTeamId: 1 }).lean();
            const isInTournament = !!match &&
                teamIds.some((teamId) => String(teamId) === String(match.homeTeamId)) &&
                teamIds.some((teamId) => String(teamId) === String(match.awayTeamId));
            if (!isInTournament) {
                return { items: [], total: 0 };
            }
        }
        else {
            const matches = yield TournamentMatch_1.default.find({
                homeTeamId: { $in: teamIds },
                awayTeamId: { $in: teamIds },
            }, { _id: 1 }).lean();
            const matchIds = matches.map((match) => match._id);
            query.matchId = { $in: matchIds };
        }
    }
    const items = yield TournamentMatchStat_1.default.find(query).sort({ createdAt: -1, _id: -1 }).lean();
    return { items, total: items.length };
});
exports.listMatchStats = listMatchStats;
const getMatchStatById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.assertObjectId)(id, "matchStatId");
    const stat = yield TournamentMatchStat_1.default.findById(id).lean();
    if (!stat) {
        throw new errors_1.TournamentsDomainError(404, "match_stat_not_found", "Match stat not found");
    }
    return stat;
});
exports.getMatchStatById = getMatchStatById;
const updateMatchStat = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.assertObjectId)(id, "matchStatId");
    const updatePayload = Object.assign({}, payload);
    if (typeof payload.sport === "string")
        updatePayload.sport = payload.sport.trim().toLowerCase();
    const stat = yield TournamentMatchStat_1.default.findByIdAndUpdate(id, updatePayload, { new: true }).lean();
    if (!stat) {
        throw new errors_1.TournamentsDomainError(404, "match_stat_not_found", "Match stat not found");
    }
    return stat;
});
exports.updateMatchStat = updateMatchStat;
const deleteMatchStat = (id) => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.assertObjectId)(id, "matchStatId");
    const deleted = yield TournamentMatchStat_1.default.findByIdAndDelete(id).lean();
    if (!deleted) {
        throw new errors_1.TournamentsDomainError(404, "match_stat_not_found", "Match stat not found");
    }
    return { message: "Match stat deleted successfully", deletedMatchStatId: id };
});
exports.deleteMatchStat = deleteMatchStat;
//# sourceMappingURL=matchStatService.js.map