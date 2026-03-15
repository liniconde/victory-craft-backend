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
exports.deleteTournament = exports.updateTournament = exports.getTournamentById = exports.listTournaments = exports.createTournament = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Tournament_1 = __importDefault(require("../models/Tournament"));
const TournamentTeam_1 = __importDefault(require("../models/TournamentTeam"));
const TournamentPlayer_1 = __importDefault(require("../models/TournamentPlayer"));
const TournamentMatch_1 = __importDefault(require("../models/TournamentMatch"));
const TournamentMatchStat_1 = __importDefault(require("../models/TournamentMatchStat"));
const errors_1 = require("./errors");
const utils_1 = require("./utils");
const createTournament = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (!((_a = payload.name) === null || _a === void 0 ? void 0 : _a.trim())) {
        throw new errors_1.TournamentsDomainError(400, "invalid_name", "name is required");
    }
    if (!((_b = payload.sport) === null || _b === void 0 ? void 0 : _b.trim())) {
        throw new errors_1.TournamentsDomainError(400, "invalid_sport", "sport is required");
    }
    if (payload.ownerId) {
        (0, utils_1.assertObjectId)(payload.ownerId, "ownerId");
    }
    const tournament = yield Tournament_1.default.create({
        name: payload.name.trim(),
        sport: payload.sport.trim().toLowerCase(),
        description: (_c = payload.description) === null || _c === void 0 ? void 0 : _c.trim(),
        ownerId: payload.ownerId,
        startsAt: (0, utils_1.parseOptionalDate)(payload.startsAt),
        endsAt: (0, utils_1.parseOptionalDate)(payload.endsAt),
        status: payload.status || "draft",
    });
    return tournament.toObject();
});
exports.createTournament = createTournament;
const listTournaments = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const query = {};
    if ((_a = filters === null || filters === void 0 ? void 0 : filters.sport) === null || _a === void 0 ? void 0 : _a.trim()) {
        query.sport = filters.sport.trim().toLowerCase();
    }
    if ((_b = filters === null || filters === void 0 ? void 0 : filters.status) === null || _b === void 0 ? void 0 : _b.trim()) {
        query.status = filters.status.trim();
    }
    const items = yield Tournament_1.default.find(query).sort({ createdAt: -1, _id: -1 }).lean();
    return { items, total: items.length };
});
exports.listTournaments = listTournaments;
const getTournamentById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.assertObjectId)(id, "tournamentId");
    const tournament = yield Tournament_1.default.findById(id).lean();
    if (!tournament) {
        throw new errors_1.TournamentsDomainError(404, "tournament_not_found", "Tournament not found");
    }
    return tournament;
});
exports.getTournamentById = getTournamentById;
const updateTournament = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.assertObjectId)(id, "tournamentId");
    const updatePayload = Object.assign({}, payload);
    if (typeof payload.name === "string")
        updatePayload.name = payload.name.trim();
    if (typeof payload.sport === "string")
        updatePayload.sport = payload.sport.trim().toLowerCase();
    if (typeof payload.description === "string")
        updatePayload.description = payload.description.trim();
    if (typeof payload.startsAt !== "undefined")
        updatePayload.startsAt = (0, utils_1.parseOptionalDate)(payload.startsAt);
    if (typeof payload.endsAt !== "undefined")
        updatePayload.endsAt = (0, utils_1.parseOptionalDate)(payload.endsAt);
    if (payload.ownerId) {
        (0, utils_1.assertObjectId)(payload.ownerId, "ownerId");
    }
    const tournament = yield Tournament_1.default.findByIdAndUpdate(id, updatePayload, { new: true }).lean();
    if (!tournament) {
        throw new errors_1.TournamentsDomainError(404, "tournament_not_found", "Tournament not found");
    }
    return tournament;
});
exports.updateTournament = updateTournament;
const deleteTournament = (id) => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.assertObjectId)(id, "tournamentId");
    const tournament = yield Tournament_1.default.findById(id).lean();
    if (!tournament) {
        throw new errors_1.TournamentsDomainError(404, "tournament_not_found", "Tournament not found");
    }
    const tournamentObjectId = new mongoose_1.default.Types.ObjectId(id);
    const teams = yield TournamentTeam_1.default.find({ tournamentId: tournamentObjectId }, { _id: 1 }).lean();
    const teamIds = teams.map((team) => team._id);
    const matches = teamIds.length
        ? yield TournamentMatch_1.default.find({
            homeTeamId: { $in: teamIds },
            awayTeamId: { $in: teamIds },
        }, { _id: 1 }).lean()
        : [];
    const matchIds = matches.map((match) => match._id);
    yield Promise.all([
        Tournament_1.default.deleteOne({ _id: tournamentObjectId }),
        TournamentTeam_1.default.deleteMany({ tournamentId: tournamentObjectId }),
        teamIds.length ? TournamentPlayer_1.default.deleteMany({ teamId: { $in: teamIds } }) : Promise.resolve(),
        matchIds.length ? TournamentMatch_1.default.deleteMany({ _id: { $in: matchIds } }) : Promise.resolve(),
        matchIds.length ? TournamentMatchStat_1.default.deleteMany({ matchId: { $in: matchIds } }) : Promise.resolve(),
    ]);
    return {
        message: "Tournament deleted successfully",
        deletedTournamentId: id,
        deletedTeamsCount: teamIds.length,
        deletedMatchesCount: matchIds.length,
    };
});
exports.deleteTournament = deleteTournament;
//# sourceMappingURL=tournamentService.js.map