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
const handleVideoStatsError = (res, error) => {
    if (error instanceof videoStatsService_1.VideoStatsServiceError) {
        res.status(error.status).json({ message: error.message, code: error.code });
        return;
    }
    res.status(500).json({ message: error.message });
};
/**
 * 📌 Crea estadísticas para un video.
 * Requiere: `videoId`, `statistics` (incluye `teams`), `generatedByModel`.
 */
const handleCreateVideoStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { videoId } = req.body;
        const sportType = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.sportType) || ((_c = (_b = req.body) === null || _b === void 0 ? void 0 : _b.statistics) === null || _c === void 0 ? void 0 : _c.sportType);
        if (!videoId || !sportType) {
            res.status(400).json({
                message: "videoId and sportType are required (sportType can be inside statistics.sportType for backward compatibility).",
            });
            return;
        }
        const stats = yield (0, videoStatsService_1.createVideoStats)(req.body);
        res.status(201).json(stats);
    }
    catch (error) {
        handleVideoStatsError(res, error);
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
        res.status(200).json(stats);
    }
    catch (error) {
        handleVideoStatsError(res, error);
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
        res.status(200).json(stats);
    }
    catch (error) {
        handleVideoStatsError(res, error);
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
        handleVideoStatsError(res, error);
    }
});
exports.handleDeleteVideoStats = handleDeleteVideoStats;
//# sourceMappingURL=videoStatsController.js.map