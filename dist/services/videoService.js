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
exports.deleteVideoById = exports.getVideosByField = exports.updateVideo = exports.getMyLibraryVideosPaginated = exports.getLibraryVideosPaginated = exports.createLibraryVideo = exports.createVideo = exports.VideoServiceError = void 0;
const Video_1 = __importDefault(require("../models/Video"));
const s3FilesService_1 = require("./s3FilesService");
const s3FilesService_2 = require("./s3FilesService");
const s3FilesService_3 = require("./s3FilesService");
const mongoose_1 = __importDefault(require("mongoose"));
const VideoStats_1 = __importDefault(require("../models/VideoStats"));
const AnalysisJob_1 = __importDefault(require("../models/AnalysisJob"));
const VideoAnalysisRecord_1 = __importDefault(require("../models/VideoAnalysisRecord"));
const AnalysisArtifact_1 = __importDefault(require("../models/AnalysisArtifact"));
const VideoSegment_1 = __importDefault(require("../models/VideoSegment"));
const Notification_1 = __importDefault(require("../models/Notification"));
class VideoServiceError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.VideoServiceError = VideoServiceError;
const isS3NotFoundError = (error) => {
    const errorCode = (error === null || error === void 0 ? void 0 : error.code) || (error === null || error === void 0 ? void 0 : error.name);
    return errorCode === "NoSuchKey" || errorCode === "NotFound";
};
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
            ownerUserId: videoData.ownerUserId,
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
const getLibraryVideosPaginated = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 20, searchTerm, sportType, mine = false, currentUserId) {
    var _a, _b, _c, _d;
    try {
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(100, Math.max(1, limit));
        const skip = (safePage - 1) * safeLimit;
        const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const baseMatch = { s3Key: { $exists: true, $ne: "" } };
        const safeQuery = (searchTerm || "").trim();
        const safeSportType = (sportType || "").trim().toLowerCase();
        if (safeSportType) {
            baseMatch.sportType = safeSportType;
        }
        if (mine) {
            if (!currentUserId || !mongoose_1.default.Types.ObjectId.isValid(currentUserId)) {
                throw new VideoServiceError(401, "unauthorized", "Authentication is required");
            }
            baseMatch.ownerUserId = new mongoose_1.default.Types.ObjectId(currentUserId);
        }
        const matchStage = !safeQuery
            ? baseMatch
            : {
                $and: [
                    baseMatch,
                    {
                        $or: [
                            { s3Key: { $regex: escapeRegex(safeQuery), $options: "i" } },
                            {
                                $expr: {
                                    $regexMatch: {
                                        input: { $toString: "$_id" },
                                        regex: escapeRegex(safeQuery),
                                        options: "i",
                                    },
                                },
                            },
                        ],
                    },
                ],
            };
        const rows = yield Video_1.default.aggregate([
            { $match: matchStage },
            { $sort: { uploadedAt: -1 } },
            {
                $facet: {
                    items: [
                        { $skip: skip },
                        { $limit: safeLimit },
                        { $project: { _id: 1, s3Key: 1, uploadedAt: 1, sportType: 1, ownerUserId: 1 } },
                    ],
                    totalCount: [{ $count: "count" }],
                },
            },
        ]);
        const videos = ((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.items) || [];
        const total = ((_d = (_c = (_b = rows[0]) === null || _b === void 0 ? void 0 : _b.totalCount) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.count) || 0;
        const items = videos.map((video) => ({
            _id: video._id,
            s3Key: video.s3Key,
            uploadedAt: video.uploadedAt,
            videoUrl: (0, s3FilesService_2.getObjectS3SignedUrl)(video.s3Key),
            sportType: video.sportType,
            ownerUserId: video.ownerUserId || null,
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
        if (error instanceof VideoServiceError) {
            throw error;
        }
        throw new Error(`Error fetching library videos: ${error.message}`);
    }
});
exports.getLibraryVideosPaginated = getLibraryVideosPaginated;
const getMyLibraryVideosPaginated = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 20, searchTerm, sportType, currentUserId) { return (0, exports.getLibraryVideosPaginated)(page, limit, searchTerm, sportType, true, currentUserId); });
exports.getMyLibraryVideosPaginated = getMyLibraryVideosPaginated;
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
const deleteVideoById = (videoId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!videoId || !mongoose_1.default.Types.ObjectId.isValid(videoId)) {
        throw new VideoServiceError(400, "invalid_video_id", "Video id is invalid");
    }
    const video = yield Video_1.default.findById(videoId);
    if (!video) {
        throw new VideoServiceError(404, "video_not_found", "Video not found");
    }
    const videoObjectId = new mongoose_1.default.Types.ObjectId(videoId);
    const [artifacts, segments] = yield Promise.all([
        AnalysisArtifact_1.default.find({ videoId: videoObjectId }).select({ "storage.s3Key": 1 }).lean(),
        VideoSegment_1.default.find({ libraryVideoId: videoObjectId }).select({ s3Key: 1 }).lean(),
    ]);
    const s3KeysToDelete = new Set();
    const addS3Key = (value) => {
        const key = (value || "").trim();
        if (key)
            s3KeysToDelete.add(key);
    };
    addS3Key(video.s3Key);
    artifacts.forEach((artifact) => { var _a; return addS3Key((_a = artifact === null || artifact === void 0 ? void 0 : artifact.storage) === null || _a === void 0 ? void 0 : _a.s3Key); });
    segments.forEach((segment) => addS3Key(segment === null || segment === void 0 ? void 0 : segment.s3Key));
    const s3DeleteErrors = [];
    yield Promise.all([...s3KeysToDelete].map((objectKey) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield (0, s3FilesService_3.deleteObjectS3)(objectKey);
        }
        catch (error) {
            if (!isS3NotFoundError(error)) {
                s3DeleteErrors.push(`${objectKey}: ${(error === null || error === void 0 ? void 0 : error.message) || "unknown error"}`);
            }
        }
    })));
    if (s3DeleteErrors.length > 0) {
        throw new VideoServiceError(502, "s3_delete_failed", `Failed to delete object(s) from S3: ${s3DeleteErrors.join(" | ")}`);
    }
    yield Promise.all([
        Video_1.default.findByIdAndDelete(videoObjectId),
        VideoStats_1.default.deleteOne({ videoId: videoObjectId }),
        AnalysisJob_1.default.deleteMany({ videoId: videoObjectId }),
        VideoAnalysisRecord_1.default.deleteMany({ videoId: videoObjectId }),
        AnalysisArtifact_1.default.deleteMany({ videoId: videoObjectId }),
        Notification_1.default.deleteMany({ videoId: videoObjectId }),
        VideoSegment_1.default.deleteMany({ libraryVideoId: videoObjectId }),
    ]);
    return {
        message: "Video deleted successfully",
        deletedVideoId: videoId,
        deletedS3Key: video.s3Key,
    };
});
exports.deleteVideoById = deleteVideoById;
//# sourceMappingURL=videoService.js.map