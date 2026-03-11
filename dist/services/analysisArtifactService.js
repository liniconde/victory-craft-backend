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
exports.listAnalysisArtifactsByJobId = exports.listAnalysisArtifactsByVideoId = exports.upsertAnalysisArtifacts = exports.AnalysisArtifactServiceError = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const AnalysisArtifact_1 = __importDefault(require("../models/AnalysisArtifact"));
class AnalysisArtifactServiceError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.AnalysisArtifactServiceError = AnalysisArtifactServiceError;
const assertObjectId = (value, code, message) => {
    if (!value || !mongoose_1.default.Types.ObjectId.isValid(value)) {
        throw new AnalysisArtifactServiceError(400, code, message);
    }
};
const toObjectId = (value) => new mongoose_1.default.Types.ObjectId(value);
const buildCompatibleIdQuery = (value) => ({
    $in: [value, toObjectId(value)],
});
const normalizeArtifact = (artifact) => ({
    videoId: toObjectId(artifact.videoId),
    analysisJobId: toObjectId(artifact.analysisJobId),
    flow: artifact.flow,
    producer: artifact.producer,
    executionId: artifact.executionId,
    resultId: artifact.resultId,
    artifactId: artifact.artifactId,
    artifactType: artifact.artifactType,
    role: artifact.role || "supporting_output",
    promptKey: artifact.promptKey,
    promptVersion: artifact.promptVersion,
    storage: artifact.storage,
    mimeType: artifact.mimeType,
    fileSizeBytes: artifact.fileSizeBytes,
    filename: artifact.filename,
    title: artifact.title,
    description: artifact.description,
    stepName: artifact.stepName,
    toolName: artifact.toolName,
    isPrimary: artifact.isPrimary,
    schemaName: artifact.schemaName,
    schemaVersion: artifact.schemaVersion,
    metadata: artifact.metadata || {},
    preview: artifact.preview || {},
    requestId: artifact.requestId,
    correlationId: artifact.correlationId,
    resultStatus: artifact.resultStatus,
    summary: artifact.summary,
    producedAt: new Date(artifact.producedAt),
});
const upsertAnalysisArtifacts = (artifacts) => __awaiter(void 0, void 0, void 0, function* () {
    if (!artifacts.length) {
        return [];
    }
    const operations = artifacts.map((artifact) => ({
        updateOne: {
            filter: {
                executionId: artifact.executionId,
                artifactId: artifact.artifactId,
            },
            update: {
                $set: normalizeArtifact(artifact),
            },
            upsert: true,
        },
    }));
    yield AnalysisArtifact_1.default.bulkWrite(operations);
    const artifactIds = artifacts.map((artifact) => artifact.artifactId);
    const docs = yield AnalysisArtifact_1.default.find({
        executionId: artifacts[0].executionId,
        artifactId: { $in: artifactIds },
    }).sort({ createdAt: 1 });
    return docs.map((doc) => (doc.toObject ? doc.toObject() : doc));
});
exports.upsertAnalysisArtifacts = upsertAnalysisArtifacts;
const listAnalysisArtifactsByVideoId = (videoId, options) => __awaiter(void 0, void 0, void 0, function* () {
    assertObjectId(videoId, "invalid_video_id", "Invalid video id");
    const page = Math.max(1, (options === null || options === void 0 ? void 0 : options.page) || 1);
    const limit = Math.min(100, Math.max(1, (options === null || options === void 0 ? void 0 : options.limit) || 20));
    const skip = (page - 1) * limit;
    const [items, total] = yield Promise.all([
        AnalysisArtifact_1.default.find({ videoId: buildCompatibleIdQuery(videoId) })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        AnalysisArtifact_1.default.countDocuments({ videoId: buildCompatibleIdQuery(videoId) }),
    ]);
    return {
        items: items.map((item) => (item.toObject ? item.toObject() : item)),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
        },
    };
});
exports.listAnalysisArtifactsByVideoId = listAnalysisArtifactsByVideoId;
const listAnalysisArtifactsByJobId = (analysisJobId, options) => __awaiter(void 0, void 0, void 0, function* () {
    assertObjectId(analysisJobId, "invalid_job_id", "Invalid analysis job id");
    const page = Math.max(1, (options === null || options === void 0 ? void 0 : options.page) || 1);
    const limit = Math.min(100, Math.max(1, (options === null || options === void 0 ? void 0 : options.limit) || 20));
    const skip = (page - 1) * limit;
    const [items, total] = yield Promise.all([
        AnalysisArtifact_1.default.find({ analysisJobId: buildCompatibleIdQuery(analysisJobId) })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        AnalysisArtifact_1.default.countDocuments({ analysisJobId: buildCompatibleIdQuery(analysisJobId) }),
    ]);
    return {
        items: items.map((item) => (item.toObject ? item.toObject() : item)),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
        },
    };
});
exports.listAnalysisArtifactsByJobId = listAnalysisArtifactsByJobId;
//# sourceMappingURL=analysisArtifactService.js.map