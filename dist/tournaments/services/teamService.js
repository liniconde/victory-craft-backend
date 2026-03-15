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
exports.deleteTeam = exports.updateTeam = exports.getTeamById = exports.listTeams = exports.createTeam = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Tournament_1 = __importDefault(require("../models/Tournament"));
const TournamentTeam_1 = __importDefault(require("../models/TournamentTeam"));
const TournamentPlayer_1 = __importDefault(require("../models/TournamentPlayer"));
const TournamentMatch_1 = __importDefault(require("../models/TournamentMatch"));
const TournamentMatchStat_1 = __importDefault(require("../models/TournamentMatchStat"));
const errors_1 = require("./errors");
const utils_1 = require("./utils");
const createTeam = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    (0, utils_1.assertObjectId)(payload.tournamentId, "tournamentId");
    if (!((_a = payload.name) === null || _a === void 0 ? void 0 : _a.trim())) {
        throw new errors_1.TournamentsDomainError(400, "invalid_name", "name is required");
    }
    const tournament = yield Tournament_1.default.findById(payload.tournamentId).lean();
    if (!tournament) {
        throw new errors_1.TournamentsDomainError(404, "tournament_not_found", "Tournament not found");
    }
    const team = yield TournamentTeam_1.default.create({
        tournamentId: payload.tournamentId,
        name: payload.name.trim(),
        shortName: (_b = payload.shortName) === null || _b === void 0 ? void 0 : _b.trim(),
        logoUrl: (_c = payload.logoUrl) === null || _c === void 0 ? void 0 : _c.trim(),
        coachName: (_d = payload.coachName) === null || _d === void 0 ? void 0 : _d.trim(),
    });
    return team.toObject();
});
exports.createTeam = createTeam;
const listTeams = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {};
    if (filters === null || filters === void 0 ? void 0 : filters.tournamentId) {
        (0, utils_1.assertObjectId)(filters.tournamentId, "tournamentId");
        query.tournamentId = filters.tournamentId;
    }
    const items = yield TournamentTeam_1.default.find(query).sort({ createdAt: 1, _id: 1 }).lean();
    return { items, total: items.length };
});
exports.listTeams = listTeams;
const getTeamById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.assertObjectId)(id, "teamId");
    const team = yield TournamentTeam_1.default.findById(id).lean();
    if (!team) {
        throw new errors_1.TournamentsDomainError(404, "team_not_found", "Team not found");
    }
    return team;
});
exports.getTeamById = getTeamById;
const updateTeam = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.assertObjectId)(id, "teamId");
    const updatePayload = Object.assign({}, payload);
    if (typeof payload.name === "string")
        updatePayload.name = payload.name.trim();
    if (typeof payload.shortName === "string")
        updatePayload.shortName = payload.shortName.trim();
    if (typeof payload.logoUrl === "string")
        updatePayload.logoUrl = payload.logoUrl.trim();
    if (typeof payload.coachName === "string")
        updatePayload.coachName = payload.coachName.trim();
    const team = yield TournamentTeam_1.default.findByIdAndUpdate(id, updatePayload, { new: true }).lean();
    if (!team) {
        throw new errors_1.TournamentsDomainError(404, "team_not_found", "Team not found");
    }
    return team;
});
exports.updateTeam = updateTeam;
const deleteTeam = (id) => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.assertObjectId)(id, "teamId");
    const team = yield TournamentTeam_1.default.findById(id).lean();
    if (!team) {
        throw new errors_1.TournamentsDomainError(404, "team_not_found", "Team not found");
    }
    const teamObjectId = new mongoose_1.default.Types.ObjectId(id);
    const [matchesAsHome, matchesAsAway] = yield Promise.all([
        TournamentMatch_1.default.find({ homeTeamId: teamObjectId }, { _id: 1 }).lean(),
        TournamentMatch_1.default.find({ awayTeamId: teamObjectId }, { _id: 1 }).lean(),
    ]);
    const matchIdsSet = new Set([...matchesAsHome, ...matchesAsAway].map((match) => String(match._id)));
    const matchIds = [...matchIdsSet].map((matchId) => new mongoose_1.default.Types.ObjectId(matchId));
    yield Promise.all([
        TournamentTeam_1.default.deleteOne({ _id: teamObjectId }),
        TournamentPlayer_1.default.deleteMany({ teamId: teamObjectId }),
        matchIds.length ? TournamentMatch_1.default.deleteMany({ _id: { $in: matchIds } }) : Promise.resolve(),
        matchIds.length ? TournamentMatchStat_1.default.deleteMany({ matchId: { $in: matchIds } }) : Promise.resolve(),
    ]);
    return {
        message: "Team deleted successfully",
        deletedTeamId: id,
        deletedMatchesCount: matchIds.length,
    };
});
exports.deleteTeam = deleteTeam;
//# sourceMappingURL=teamService.js.map