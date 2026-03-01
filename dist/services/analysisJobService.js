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
exports.getAnalysisJobStatus = exports.createPromptAnalysisJob = exports.AnalysisJobServiceError = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const AnalysisJob_1 = __importDefault(require("../models/AnalysisJob"));
const Video_1 = __importDefault(require("../models/Video"));
const notificationService_1 = require("./notificationService");
const queueService_1 = require("./queueService");
class AnalysisJobServiceError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.AnalysisJobServiceError = AnalysisJobServiceError;
const validateAnalyzePromptInput = (videoId, payload) => {
    if (!videoId || !mongoose_1.default.Types.ObjectId.isValid(videoId)) {
        throw new AnalysisJobServiceError(400, "invalid_video_id", "Video id is invalid");
    }
    const analysisType = payload.analysisType || "agent_prompt";
    if (!["agent_prompt", "custom"].includes(analysisType)) {
        throw new AnalysisJobServiceError(400, "invalid_analysis_type", "analysisType must be agent_prompt or custom");
    }
    if (analysisType === "agent_prompt" && (!payload.prompt || !payload.prompt.trim())) {
        throw new AnalysisJobServiceError(400, "invalid_prompt", "prompt is required for agent_prompt");
    }
};
const createPromptAnalysisJob = (videoId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    validateAnalyzePromptInput(videoId, payload);
    const videoExists = yield Video_1.default.exists({ _id: videoId });
    if (!videoExists) {
        throw new AnalysisJobServiceError(404, "video_not_found", "Video not found");
    }
    const analysisType = payload.analysisType || "agent_prompt";
    const input = Object.assign({ prompt: payload.prompt || "" }, (payload.input || {}));
    const job = yield AnalysisJob_1.default.create({
        videoId,
        analysisType,
        status: "queued",
        input,
    });
    try {
        const messageId = yield (0, queueService_1.sendAnalysisJobToQueue)({
            jobId: String(job._id),
            videoId,
            analysisType,
            input,
            createdAt: job.createdAt,
        });
        const updated = yield AnalysisJob_1.default.findByIdAndUpdate(job._id, { sqsMessageId: messageId, status: "queued" }, { new: true });
        yield (0, notificationService_1.createNotification)({
            type: "analysis_queued",
            message: `Analysis job queued for video ${videoId}`,
            videoId,
            analysisJobId: String(job._id),
            metadata: { analysisType, status: "queued" },
        });
        return (updated === null || updated === void 0 ? void 0 : updated.toObject()) || job.toObject();
    }
    catch (error) {
        const failed = yield AnalysisJob_1.default.findByIdAndUpdate(job._id, { status: "failed", errorMessage: error.message }, { new: true });
        yield (0, notificationService_1.createNotification)({
            type: "analysis_failed",
            message: `Failed to queue analysis job for video ${videoId}`,
            videoId,
            analysisJobId: String(job._id),
            metadata: { reason: error.message },
        });
        throw new AnalysisJobServiceError(500, "queue_enqueue_failed", (failed === null || failed === void 0 ? void 0 : failed.errorMessage) || "Failed to enqueue analysis job");
    }
});
exports.createPromptAnalysisJob = createPromptAnalysisJob;
const getAnalysisJobStatus = (videoId, jobId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!videoId || !mongoose_1.default.Types.ObjectId.isValid(videoId)) {
        throw new AnalysisJobServiceError(400, "invalid_video_id", "Video id is invalid");
    }
    if (!jobId || !mongoose_1.default.Types.ObjectId.isValid(jobId)) {
        throw new AnalysisJobServiceError(400, "invalid_job_id", "Job id is invalid");
    }
    const job = yield AnalysisJob_1.default.findOne({ _id: jobId, videoId });
    if (!job) {
        throw new AnalysisJobServiceError(404, "job_not_found", "Analysis job not found");
    }
    return job.toObject();
});
exports.getAnalysisJobStatus = getAnalysisJobStatus;
//# sourceMappingURL=analysisJobService.js.map