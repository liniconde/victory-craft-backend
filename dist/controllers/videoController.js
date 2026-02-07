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
exports.handleUploadVideo = exports.handleUpdateVideo = exports.handleCreateVideo = exports.getVideosByFieldController = void 0;
const videoService_1 = require("../services/videoService");
const s3FilesService_1 = require("../services/s3FilesService");
const getVideosByFieldController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fieldId } = req.params;
        const videos = yield (0, videoService_1.getVideosByField)(fieldId);
        if (!fieldId) {
            res
                .status(400)
                .json({ error: "Field ID is required" });
            return;
        }
        res.status(200).json(videos);
    }
    catch (error) {
        console.error("error", error);
        res.status(500).json({ message: error.message });
    }
});
exports.getVideosByFieldController = getVideosByFieldController;
/**
 * 📌 Crea un nuevo video asociado a una campo y opcionalmente a un partido.
 * Recibe `fieldId`, `matchId` (opcional) y `s3Key` desde el cuerpo de la solicitud.
 */
const handleCreateVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fieldId, matchId, s3Key, slotId } = req.body;
        console.log(req.body);
        if (!fieldId || !s3Key || !slotId) {
            res
                .status(400)
                .json({ error: "Field ID and S3 key and SlotId are required" });
        }
        const video = yield (0, videoService_1.createVideo)({ fieldId, matchId, s3Key, slotId });
        res.status(201).json(video);
    }
    catch (error) {
        console.error("error", error);
        res.status(500).json({ message: error.message });
    }
});
exports.handleCreateVideo = handleCreateVideo;
// Actualizar un video
const handleUpdateVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedVideo = yield (0, videoService_1.updateVideo)(req.params.id, req.body);
        if (!updatedVideo) {
            res.status(404).json({ message: "Video not found" });
        }
        res.json(updatedVideo);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});
exports.handleUpdateVideo = handleUpdateVideo;
/**
 * Genera una URL firmada para subir una imagen a S3.
 * @param req - Request de Express con el `objectKey` en el body.
 * @param res - Response de Express.
 */
const handleUploadVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("entro acca", req.body);
        const { objectKey } = req.body;
        if (!objectKey) {
            res.status(400).json({ message: "objectKey is required" });
        }
        const { url, s3Url } = (0, s3FilesService_1.getUploadS3SignedUrl)(objectKey);
        res.status(200).json({ uploadUrl: url, s3Url, objectKey });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generating upload URL" });
    }
});
exports.handleUploadVideo = handleUploadVideo;
//# sourceMappingURL=videoController.js.map