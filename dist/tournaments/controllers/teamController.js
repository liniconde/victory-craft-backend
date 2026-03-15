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
exports.handleDeleteTeam = exports.handleUpdateTeam = exports.handleGetTeam = exports.handleListTeams = exports.handleCreateTeam = void 0;
const teamService_1 = require("../services/teamService");
const common_1 = require("./common");
const handleCreateTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, teamService_1.createTeam)(req.body || {});
        res.status(201).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleCreateTeam = handleCreateTeam;
const handleListTeams = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tournamentId = typeof req.query.tournamentId === "string" ? req.query.tournamentId : undefined;
        const result = yield (0, teamService_1.listTeams)({ tournamentId });
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleListTeams = handleListTeams;
const handleGetTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, teamService_1.getTeamById)(req.params.id);
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleGetTeam = handleGetTeam;
const handleUpdateTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, teamService_1.updateTeam)(req.params.id, req.body || {});
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleUpdateTeam = handleUpdateTeam;
const handleDeleteTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, teamService_1.deleteTeam)(req.params.id);
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleDeleteTeam = handleDeleteTeam;
//# sourceMappingURL=teamController.js.map