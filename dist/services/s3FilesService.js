"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getObjectS3SignedUrl = exports.getUploadS3SignedUrl = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const s3 = new aws_sdk_1.default.S3({
    signatureVersion: "v4",
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
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
const getObjectS3SignedUrl = (objectKey) => {
    console.log("object keyy", objectKey);
    const signedUrlExpireSeconds = 60 * 5; // URL válida por 5 minutos
    // Obtiene la URL firmada
    const url = s3.getSignedUrl("getObject", {
        Bucket: BUCKET_NAME,
        Key: objectKey,
        Expires: signedUrlExpireSeconds,
    });
    return url;
};
exports.getObjectS3SignedUrl = getObjectS3SignedUrl;
//# sourceMappingURL=s3FilesService.js.map