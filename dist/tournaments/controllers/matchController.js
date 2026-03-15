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
exports.handleDeleteMatch = exports.handleUpdateMatch = exports.handleGetMatch = exports.handleListMatches = exports.handleCreateMatch = void 0;
const matchService_1 = require("../services/matchService");
const common_1 = require("./common");
const handleCreateMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, matchService_1.createMatch)(req.body || {});
        res.status(201).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleCreateMatch = handleCreateMatch;
const handleListMatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tournamentId = typeof req.query.tournamentId === "string" ? req.query.tournamentId : undefined;
        const teamId = typeof req.query.teamId === "string" ? req.query.teamId : undefined;
        const status = typeof req.query.status === "string" ? req.query.status : undefined;
        const result = yield (0, matchService_1.listMatches)({ tournamentId, teamId, status });
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleListMatches = handleListMatches;
const handleGetMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, matchService_1.getMatchById)(req.params.id);
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleGetMatch = handleGetMatch;
const handleUpdateMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, matchService_1.updateMatch)(req.params.id, req.body || {});
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleUpdateMatch = handleUpdateMatch;
const handleDeleteMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, matchService_1.deleteMatch)(req.params.id);
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleDeleteMatch = handleDeleteMatch;
//# sourceMappingURL=matchController.js.map