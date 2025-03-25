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
exports.updateVideo = exports.createVideo = void 0;
const Video_1 = __importDefault(require("../models/Video"));
const s3FilesService_1 = require("./s3FilesService");
/**
 * Crea un nuevo video asociado a una campo y opcionalmente a un partido.
 * @param videoData - Datos del video (fieldId, matchId, s3Key).
 * @returns Video con URL firmada.
 */
const createVideo = (videoData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const video = yield Video_1.default.create(videoData);
        return updateVideoSignedUrl(video);
    }
    catch (error) {
        throw new Error(`Error creating video: ${error.message}`);
    }
});
exports.createVideo = createVideo;
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
//# sourceMappingURL=videoService.js.map