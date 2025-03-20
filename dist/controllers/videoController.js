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
exports.handleCreateVideo = void 0;
const videoService_1 = require("../services/videoService");
/**
 * 📌 Crea un nuevo video asociado a una cancha y opcionalmente a un partido.
 * Recibe `fieldId`, `matchId` (opcional) y `s3Key` desde el cuerpo de la solicitud.
 */
const handleCreateVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fieldId, matchId, s3Key } = req.body;
        if (!fieldId || !s3Key) {
            res.status(400).json({ error: "Field ID and S3 key are required" });
        }
        const video = yield (0, videoService_1.createVideo)({ fieldId, matchId, s3Key });
        res.status(201).json(video);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.handleCreateVideo = handleCreateVideo;
//# sourceMappingURL=videoController.js.map