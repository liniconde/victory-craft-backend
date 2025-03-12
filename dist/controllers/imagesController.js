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
exports.handleGetImage = exports.handleUploadImage = void 0;
const imagesService_1 = require("../services/imagesService");
/**
 * Genera una URL firmada para subir una imagen a S3.
 * @param req - Request de Express con el `objectKey` en el body.
 * @param res - Response de Express.
 */
const handleUploadImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { objectKey } = req.body;
        if (!objectKey) {
            res.status(400).json({ message: "objectKey is required" });
        }
        const { url, s3Url } = yield (0, imagesService_1.getUploadS3SignedUrl)(objectKey);
        res.status(200).json({ uploadUrl: url, s3Url, objectKey });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generating upload URL" });
    }
});
exports.handleUploadImage = handleUploadImage;
/**
 * Genera una URL firmada para obtener una imagen desde S3.
 * @param req - Request de Express con el `objectKey` en el body.
 * @param res - Response de Express.
 */
const handleGetImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { objectKey } = req.body;
        if (!objectKey) {
            res.status(400).json({ message: "objectKey is required" });
        }
        const url = yield (0, imagesService_1.getObjectS3SignedUrl)(objectKey);
        res.status(200).json({ downloadUrl: url, objectKey });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generating download URL" });
    }
});
exports.handleGetImage = handleGetImage;
//# sourceMappingURL=imagesController.js.map