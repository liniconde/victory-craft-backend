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
exports.deleteVideoStats = exports.updateVideoStats = exports.getVideoStatsByVideoId = exports.createVideoStats = void 0;
const VideoStats_1 = __importDefault(require("../models/VideoStats"));
/**
 * Crea estadísticas para un video.
 * @param statsData - Objeto con videoId, statistics (incluye sportType y teams), generatedByModel
 * @returns Estadísticas creadas
 */
const createVideoStats = (statsData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield VideoStats_1.default.create(statsData);
        return stats.toObject();
    }
    catch (error) {
        throw new Error(`Error creating video stats: ${error.message}`);
    }
});
exports.createVideoStats = createVideoStats;
/**
 * Obtiene las estadísticas de un video por ID de video.
 * @param videoId - ID del video
 * @returns Estadísticas del video
 */
const getVideoStatsByVideoId = (videoId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield VideoStats_1.default.findOne({ videoId });
        if (!stats)
            throw new Error("Stats not found for this video");
        return stats.toObject();
    }
    catch (error) {
        throw new Error(`Error fetching video stats: ${error.message}`);
    }
});
exports.getVideoStatsByVideoId = getVideoStatsByVideoId;
/**
 * Actualiza las estadísticas de un video.
 * @param videoId - ID del video
 * @param updateData - Nuevos datos a actualizar
 * @returns Estadísticas actualizadas
 */
const updateVideoStats = (videoId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updated = yield VideoStats_1.default.findOneAndUpdate({ videoId }, updateData, {
            new: true,
        });
        if (!updated)
            throw new Error("Stats not found for update");
        return updated.toObject();
    }
    catch (error) {
        throw new Error(`Error updating video stats: ${error.message}`);
    }
});
exports.updateVideoStats = updateVideoStats;
/**
 * Elimina las estadísticas de un video.
 * @param videoId - ID del video
 * @returns Mensaje de éxito
 */
const deleteVideoStats = (videoId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deleted = yield VideoStats_1.default.findOneAndDelete({ videoId });
        if (!deleted)
            throw new Error("Stats not found to delete");
        return { message: "Video stats deleted successfully" };
    }
    catch (error) {
        throw new Error(`Error deleting video stats: ${error.message}`);
    }
});
exports.deleteVideoStats = deleteVideoStats;
//# sourceMappingURL=videoStatsService.js.map