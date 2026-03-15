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
exports.handleGenerateTournamentMatches = exports.handleDeleteTournament = exports.handleUpdateTournament = exports.handleGetTournament = exports.handleListTournaments = exports.handleCreateTournament = void 0;
const tournamentService_1 = require("../services/tournamentService");
const matchService_1 = require("../services/matchService");
const common_1 = require("./common");
const handleCreateTournament = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, tournamentService_1.createTournament)(req.body || {});
        res.status(201).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleCreateTournament = handleCreateTournament;
const handleListTournaments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sport = typeof req.query.sport === "string" ? req.query.sport : undefined;
        const status = typeof req.query.status === "string" ? req.query.status : undefined;
        const result = yield (0, tournamentService_1.listTournaments)({ sport, status });
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleListTournaments = handleListTournaments;
const handleGetTournament = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, tournamentService_1.getTournamentById)(req.params.id);
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleGetTournament = handleGetTournament;
const handleUpdateTournament = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, tournamentService_1.updateTournament)(req.params.id, req.body || {});
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleUpdateTournament = handleUpdateTournament;
const handleDeleteTournament = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, tournamentService_1.deleteTournament)(req.params.id);
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleDeleteTournament = handleDeleteTournament;
const handleGenerateTournamentMatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, matchService_1.generateMatchesForTournament)(req.params.id);
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleGenerateTournamentMatches = handleGenerateTournamentMatches;
//# sourceMappingURL=tournamentController.js.map