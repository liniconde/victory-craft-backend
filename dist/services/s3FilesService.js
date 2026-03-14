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
exports.deleteObjectS3 = exports.getObjectS3SignedUrl = exports.getUploadS3SignedUrl = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const s3 = new aws_sdk_1.default.S3({
    signatureVersion: "v4",
    region: process.env.AWS_REGION,
});
const BUCKET_NAME = process.env.BUCKET_NAME || "victory-craft";
const getUploadS3SignedUrl = (objectKey) => {
    // Configura las opciones para obtener la URL firmada para subir
    const url = s3.getSignedUrl("putObject", {
        Bucket: BUCKET_NAME,
        Key: objectKey,
        Expires: 600, // Tiempo en segundos antes de que la URL expire
    });
    const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/${objectKey}`;
    // Devuelve la URL firmada
    return { s3Url, objectKey, url };
};
exports.getUploadS3SignedUrl = getUploadS3SignedUrl;
const getObjectS3SignedUrl = (objectKey, expiresInSeconds = 60 * 5) => {
    const url = s3.getSignedUrl("getObject", {
        Bucket: BUCKET_NAME,
        Key: objectKey,
        Expires: expiresInSeconds,
    });
    return url;
};
exports.getObjectS3SignedUrl = getObjectS3SignedUrl;
const deleteObjectS3 = (objectKey) => __awaiter(void 0, void 0, void 0, function* () {
    yield s3
        .deleteObject({
        Bucket: BUCKET_NAME,
        Key: objectKey,
    })
        .promise();
});
exports.deleteObjectS3 = deleteObjectS3;
//# sourceMappingURL=s3FilesService.js.map