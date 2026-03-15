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
exports.handleDeletePlayer = exports.handleUpdatePlayer = exports.handleGetPlayer = exports.handleListPlayers = exports.handleCreatePlayer = void 0;
const playerService_1 = require("../services/playerService");
const common_1 = require("./common");
const handleCreatePlayer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, playerService_1.createPlayer)(req.body || {});
        res.status(201).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleCreatePlayer = handleCreatePlayer;
const handleListPlayers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tournamentId = typeof req.query.tournamentId === "string" ? req.query.tournamentId : undefined;
        const teamId = typeof req.query.teamId === "string" ? req.query.teamId : undefined;
        const result = yield (0, playerService_1.listPlayers)({ tournamentId, teamId });
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleListPlayers = handleListPlayers;
const handleGetPlayer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, playerService_1.getPlayerById)(req.params.id);
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleGetPlayer = handleGetPlayer;
const handleUpdatePlayer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, playerService_1.updatePlayer)(req.params.id, req.body || {});
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleUpdatePlayer = handleUpdatePlayer;
const handleDeletePlayer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, playerService_1.deletePlayer)(req.params.id);
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleDeletePlayer = handleDeletePlayer;
//# sourceMappingURL=playerController.js.map