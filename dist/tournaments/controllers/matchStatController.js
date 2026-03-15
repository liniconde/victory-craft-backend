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
exports.handleDeleteMatchStat = exports.handleUpdateMatchStat = exports.handleGetMatchStat = exports.handleListMatchStats = exports.handleCreateMatchStat = void 0;
const matchStatService_1 = require("../services/matchStatService");
const common_1 = require("./common");
const handleCreateMatchStat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, matchStatService_1.createMatchStat)(req.body || {});
        res.status(201).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleCreateMatchStat = handleCreateMatchStat;
const handleListMatchStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tournamentId = typeof req.query.tournamentId === "string" ? req.query.tournamentId : undefined;
        const matchId = typeof req.query.matchId === "string" ? req.query.matchId : undefined;
        const result = yield (0, matchStatService_1.listMatchStats)({ tournamentId, matchId });
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleListMatchStats = handleListMatchStats;
const handleGetMatchStat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, matchStatService_1.getMatchStatById)(req.params.id);
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleGetMatchStat = handleGetMatchStat;
const handleUpdateMatchStat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, matchStatService_1.updateMatchStat)(req.params.id, req.body || {});
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleUpdateMatchStat = handleUpdateMatchStat;
const handleDeleteMatchStat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, matchStatService_1.deleteMatchStat)(req.params.id);
        res.status(200).json(result);
    }
    catch (error) {
        (0, common_1.handleTournamentsError)(res, error);
    }
});
exports.handleDeleteMatchStat = handleDeleteMatchStat;
//# sourceMappingURL=matchStatController.js.map