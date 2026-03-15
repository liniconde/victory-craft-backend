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
exports.deletePlayer = exports.updatePlayer = exports.getPlayerById = exports.listPlayers = exports.createPlayer = void 0;
const TournamentTeam_1 = __importDefault(require("../models/TournamentTeam"));
const TournamentPlayer_1 = __importDefault(require("../models/TournamentPlayer"));
const errors_1 = require("./errors");
const utils_1 = require("./utils");
const createPlayer = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    (0, utils_1.assertObjectId)(payload.teamId, "teamId");
    if (!((_a = payload.firstName) === null || _a === void 0 ? void 0 : _a.trim()) || !((_b = payload.lastName) === null || _b === void 0 ? void 0 : _b.trim())) {
        throw new errors_1.TournamentsDomainError(400, "invalid_name", "firstName and lastName are required");
    }
    const team = yield TournamentTeam_1.default.findById(payload.teamId).lean();
    if (!team) {
        throw new errors_1.TournamentsDomainError(404, "team_not_found", "Team not found");
    }
    const player = yield TournamentPlayer_1.default.create({
        teamId: payload.teamId,
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        jerseyNumber: payload.jerseyNumber,
        position: (_c = payload.position) === null || _c === void 0 ? void 0 : _c.trim(),
        birthDate: (0, utils_1.parseOptionalDate)(payload.birthDate),
    });
    return player.toObject();
});
exports.createPlayer = createPlayer;
const listPlayers = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {};
    if (filters === null || filters === void 0 ? void 0 : filters.teamId) {
        (0, utils_1.assertObjectId)(filters.teamId, "teamId");
        query.teamId = filters.teamId;
    }
    if (filters === null || filters === void 0 ? void 0 : filters.tournamentId) {
        (0, utils_1.assertObjectId)(filters.tournamentId, "tournamentId");
        const teams = yield TournamentTeam_1.default.find({ tournamentId: filters.tournamentId }, { _id: 1 }).lean();
        const teamIds = teams.map((team) => team._id);
        query.teamId = query.teamId
            ? { $in: teamIds.filter((teamId) => String(teamId) === String(query.teamId)) }
            : { $in: teamIds };
    }
    const items = yield TournamentPlayer_1.default.find(query).sort({ createdAt: 1, _id: 1 }).lean();
    return { items, total: items.length };
});
exports.listPlayers = listPlayers;
const getPlayerById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.assertObjectId)(id, "playerId");
    const player = yield TournamentPlayer_1.default.findById(id).lean();
    if (!player) {
        throw new errors_1.TournamentsDomainError(404, "player_not_found", "Player not found");
    }
    return player;
});
exports.getPlayerById = getPlayerById;
const updatePlayer = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.assertObjectId)(id, "playerId");
    const updatePayload = Object.assign({}, payload);
    if (typeof payload.firstName === "string")
        updatePayload.firstName = payload.firstName.trim();
    if (typeof payload.lastName === "string")
        updatePayload.lastName = payload.lastName.trim();
    if (typeof payload.position === "string")
        updatePayload.position = payload.position.trim();
    if (typeof payload.birthDate !== "undefined")
        updatePayload.birthDate = (0, utils_1.parseOptionalDate)(payload.birthDate);
    const player = yield TournamentPlayer_1.default.findByIdAndUpdate(id, updatePayload, { new: true }).lean();
    if (!player) {
        throw new errors_1.TournamentsDomainError(404, "player_not_found", "Player not found");
    }
    return player;
});
exports.updatePlayer = updatePlayer;
const deletePlayer = (id) => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.assertObjectId)(id, "playerId");
    const deleted = yield TournamentPlayer_1.default.findByIdAndDelete(id).lean();
    if (!deleted) {
        throw new errors_1.TournamentsDomainError(404, "player_not_found", "Player not found");
    }
    return { message: "Player deleted successfully", deletedPlayerId: id };
});
exports.deletePlayer = deletePlayer;
//# sourceMappingURL=playerService.js.map