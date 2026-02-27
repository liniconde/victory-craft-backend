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
exports.getVideosByField = exports.updateVideo = exports.getLibraryVideosPaginated = exports.createLibraryVideo = exports.createVideo = void 0;
const Video_1 = __importDefault(require("../models/Video"));
const s3FilesService_1 = require("./s3FilesService");
const s3FilesService_2 = require("./s3FilesService");
/**
 * Agrega la URL firmada de S3 a un video antes de retornarlo.
 * @param video - Documento del video en la base de datos.
 * @returns Video con URL firmada.
 */
const updateVideoSignedUrl = (video) => __awaiter(void 0, void 0, void 0, function* () {
    if (!video.s3Key)
        return video;
    const videoUrl = (0, s3FilesService_1.getUploadS3SignedUrl)(video.s3Key);
    return Object.assign(Object.assign({}, video.toObject()), { videoUrl });
});
/**
 * Crea un nuevo video asociado a una campo y opcionalmente a un partido.
 * @param videoData - Datos del video (fieldId, matchId, s3Key).
 * @returns Video con URL firmada.
 */
const createVideo = (videoData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const video = yield Video_1.default.create(Object.assign(Object.assign({}, videoData), { videoType: "field" }));
        return updateVideoSignedUrl(video);
    }
    catch (error) {
        throw new Error(`Error creating video: ${error.message}`);
    }
});
exports.createVideo = createVideo;
/**
 * Crea un nuevo video de biblioteca (sin asociacion a cancha/slot).
 * @param videoData - Datos del video (s3Key, sportType opcional).
 * @returns Video creado.
 */
const createLibraryVideo = (videoData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const video = yield Video_1.default.create({
            s3Key: videoData.s3Key,
            sportType: videoData.sportType,
            s3Url: videoData.s3Url,
            videoType: "library",
        });
        return updateVideoSignedUrl(video);
    }
    catch (error) {
        throw new Error(`Error creating video: ${error.message}`);
    }
});
exports.createLibraryVideo = createLibraryVideo;
/**
 * Lista videos de biblioteca con paginacion para mostrar en listado.
 * @param page - Pagina actual (base 1).
 * @param limit - Cantidad por pagina.
 */
const getLibraryVideosPaginated = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 20) {
    try {
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(100, Math.max(1, limit));
        const skip = (safePage - 1) * safeLimit;
        // For now, library listing should include legacy videos regardless of `videoType`.
        const filter = {
            s3Key: { $exists: true, $ne: "" },
        };
        const [videos, total] = yield Promise.all([
            Video_1.default.find(filter)
                .sort({ uploadedAt: -1 })
                .skip(skip)
                .limit(safeLimit)
                .select("_id s3Key uploadedAt")
                .lean(),
            Video_1.default.countDocuments(filter),
        ]);
        const items = videos.map((video) => ({
            _id: video._id,
            s3Key: video.s3Key,
            uploadedAt: video.uploadedAt,
            videoUrl: (0, s3FilesService_2.getObjectS3SignedUrl)(video.s3Key),
        }));
        return {
            items,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages: Math.ceil(total / safeLimit),
                hasNextPage: safePage * safeLimit < total,
                hasPrevPage: safePage > 1,
            },
        };
    }
    catch (error) {
        throw new Error(`Error fetching library videos: ${error.message}`);
    }
});
exports.getLibraryVideosPaginated = getLibraryVideosPaginated;
const updateVideo = (id, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const video = yield Video_1.default.findByIdAndUpdate(id, updateData, { new: true });
        if (!video)
            throw new Error("Video not found");
        return updateVideoSignedUrl(video);
    }
    catch (error) {
        throw new Error(`Error updating video: ${error.message}`);
    }
});
exports.updateVideo = updateVideo;
const getVideosByField = (fieldId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const videos = yield Video_1.default.find({ fieldId });
        // Map videos to include signed URL
        return Promise.all(videos.map((video) => updateVideoSignedUrl(video)));
    }
    catch (error) {
        throw new Error(`Error fetching videos by field: ${error.message}`);
    }
});
exports.getVideosByField = getVideosByField;
//# sourceMappingURL=videoService.js.map