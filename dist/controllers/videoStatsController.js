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
exports.handleDeleteVideoStats = exports.handleUpdateVideoStats = exports.handleGetVideoStats = exports.handleCreateVideoStats = void 0;
const videoStatsService_1 = require("../services/videoStatsService");
/**
 * 📌 Crea estadísticas para un video.
 * Requiere: `videoId`, `statistics` (incluye `teams`), `generatedByModel`.
 */
const handleCreateVideoStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { videoId, statistics, generatedByModel } = req.body;
        if (!videoId || !statistics || !statistics.sportType || !generatedByModel) {
            res.status(400).json({
                message: "videoId, statistics.sportType (and optional statistics.teams), and generatedByModel are required.",
            });
            return;
        }
        const stats = yield (0, videoStatsService_1.createVideoStats)({
            videoId,
            statistics,
            generatedByModel,
        });
        res.status(201).json(stats);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.handleCreateVideoStats = handleCreateVideoStats;
/**
 * 📌 Obtiene las estadísticas de un video por su ID.
 * `videoId` viene por `req.params`.
 */
const handleGetVideoStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { videoId } = req.params;
        const stats = yield (0, videoStatsService_1.getVideoStatsByVideoId)(videoId);
        if (!stats) {
            res.status(404).json({ message: "Stats not found" });
            return;
        }
        res.status(200).json(stats);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.handleGetVideoStats = handleGetVideoStats;
/**
 * 📌 Actualiza las estadísticas de un video.
 * `videoId` por `req.params`, datos por `req.body`.
 */
const handleUpdateVideoStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { videoId } = req.params;
        const stats = yield (0, videoStatsService_1.updateVideoStats)(videoId, req.body);
        if (!stats) {
            res.status(404).json({ message: "Stats not found" });
            return;
        }
        res.status(200).json(stats);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.handleUpdateVideoStats = handleUpdateVideoStats;
/**
 * 📌 Elimina las estadísticas de un video por su ID.
 */
const handleDeleteVideoStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { videoId } = req.params;
        const result = yield (0, videoStatsService_1.deleteVideoStats)(videoId);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.handleDeleteVideoStats = handleDeleteVideoStats;
//# sourceMappingURL=videoStatsController.js.map