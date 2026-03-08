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
exports.applyWorkerResultToAnalysisJob = exports.interpretWorkerResult = exports.createWorkerVideoAnalysisJob = exports.buildWorkerInboundEvent = exports.WorkerAgentServiceError = void 0;
const crypto_1 = require("crypto");
const mongoose_1 = __importDefault(require("mongoose"));
const AnalysisJob_1 = __importDefault(require("../models/AnalysisJob"));
const Video_1 = __importDefault(require("../models/Video"));
const workerAgentContracts_1 = require("../contracts/workerAgentContracts");
const notificationService_1 = require("./notificationService");
const videoAnalysisRecordService_1 = require("./videoAnalysisRecordService");
const workerAgentSqsService_1 = require("./workerAgentSqsService");
class WorkerAgentServiceError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.WorkerAgentServiceError = WorkerAgentServiceError;
const toObjectId = (value, fieldName) => {
    if (!value || !mongoose_1.default.Types.ObjectId.isValid(value)) {
        throw new WorkerAgentServiceError(400, `invalid_${fieldName}`, `${fieldName} is invalid`);
    }
};
const buildS3Uri = (params) => {
    if (params.s3Url && params.s3Url.startsWith("s3://")) {
        return params.s3Url;
    }
    const bucketName = process.env.BUCKET_NAME;
    if (!bucketName || !params.s3Key) {
        throw new WorkerAgentServiceError(500, "missing_video_s3_uri", "Cannot build video S3 URI. Configure BUCKET_NAME or persist s3Url as s3://bucket/key");
    }
    return `s3://${bucketName}/${params.s3Key}`;
};
const createIdempotencyKey = (params) => `${params.tenant}:${params.eventType}:${params.businessEntityId}:${params.version || "v1"}`;
const buildDefaultPayload = (params) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const outputDir = ((_a = params.overrides.render) === null || _a === void 0 ? void 0 : _a.outputDir) || `${params.localJobDir}/out`;
    const destinationPrefix = ((_b = params.overrides.upload) === null || _b === void 0 ? void 0 : _b.destinationPrefix) || params.outputS3Prefix;
    return Object.assign(Object.assign({}, (params.overrides.input || {})), { videoId: params.videoId, jobId: params.jobId, prompt: params.prompt, videoS3Uri: params.videoS3Uri, outputS3Prefix: params.outputS3Prefix, localJobDir: params.localJobDir, render: {
            toolName: ((_c = params.overrides.render) === null || _c === void 0 ? void 0 : _c.toolName) ||
                "video.worker.render_yolo_boxes_with_jersey_color",
            outputDir,
            yoloModel: ((_d = params.overrides.render) === null || _d === void 0 ? void 0 : _d.yoloModel) || "yolov8n.pt",
            processFps: ((_e = params.overrides.render) === null || _e === void 0 ? void 0 : _e.processFps) || 5,
            conf: ((_f = params.overrides.render) === null || _f === void 0 ? void 0 : _f.conf) || 0.25,
        }, stats: {
            toolName: ((_g = params.overrides.stats) === null || _g === void 0 ? void 0 : _g.toolName) || "video.generate_stats_json",
            outputPath: ((_h = params.overrides.stats) === null || _h === void 0 ? void 0 : _h.outputPath) || `${outputDir}/stats.json`,
        }, upload: {
            toolName: ((_j = params.overrides.upload) === null || _j === void 0 ? void 0 : _j.toolName) || "video.upload_artifacts_to_s3",
            bucket: ((_k = params.overrides.upload) === null || _k === void 0 ? void 0 : _k.bucket) || params.uploadBucket,
            destinationPrefix,
        }, analysis: {
            toolName: ((_l = params.overrides.analysis) === null || _l === void 0 ? void 0 : _l.toolName) || "video.analyze_generated_artifacts",
            analysisPrompt: ((_m = params.overrides.analysis) === null || _m === void 0 ? void 0 : _m.analysisPrompt) ||
                "Resume si los artefactos fueron generados correctamente y si hay hallazgos.",
        } });
};
const buildWorkerInboundEvent = (params) => ({
    contractVersion: "1.0",
    eventId: (0, crypto_1.randomUUID)(),
    eventType: params.eventType,
    occurredAt: new Date().toISOString(),
    tracing: {
        requestId: params.requestId || (0, crypto_1.randomUUID)(),
        correlationId: params.correlationId || (0, crypto_1.randomUUID)(),
        traceId: params.traceId || (0, crypto_1.randomUUID)(),
    },
    idempotencyKey: params.idempotencyKey,
    retry: {
        attempt: 0,
        maxAttempts: params.maxAttempts || 5,
    },
    payload: params.payload,
});
exports.buildWorkerInboundEvent = buildWorkerInboundEvent;
const mapWorkerResultToJobStatus = (status) => {
    if (status === "FAILED") {
        return "failed";
    }
    return "completed";
};
const buildAgentNotificationMetadata = (params) => (Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ flow: "agent", provider: "mcp_worker_agent", stage: params.stage }, (params.eventType ? { eventType: params.eventType } : {})), (params.requestId ? { requestId: params.requestId } : {})), (params.correlationId ? { correlationId: params.correlationId } : {})), (params.traceId ? { traceId: params.traceId } : {})), (params.eventId ? { eventId: params.eventId } : {})), (params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : {})), (params.executionId ? { executionId: params.executionId } : {})), (params.resultId ? { resultId: params.resultId } : {})), (params.workerStatus ? { workerStatus: params.workerStatus } : {})), (params.summary ? { summary: params.summary } : {})));
const createWorkerVideoAnalysisJob = (videoId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    toObjectId(videoId, "video_id");
    if (!payload.prompt || !payload.prompt.trim()) {
        throw new WorkerAgentServiceError(400, "invalid_prompt", "prompt is required");
    }
    const video = yield Video_1.default.findById(videoId);
    if (!video) {
        throw new WorkerAgentServiceError(404, "video_not_found", "Video not found");
    }
    const analysisType = payload.analysisType || "agent_prompt";
    const job = yield AnalysisJob_1.default.create({
        videoId,
        analysisType,
        status: "queued",
        input: Object.assign(Object.assign({ prompt: payload.prompt }, (payload.sportType ? { sportType: payload.sportType } : {})), (payload.input || {})),
    });
    try {
        const outputS3Prefix = payload.outputS3Prefix || `video-analysis-results/${job._id}`;
        const localJobDir = payload.localJobDir || `/tmp/video-analysis/${job._id}`;
        const videoS3Uri = buildS3Uri({ s3Url: video.s3Url, s3Key: video.s3Key });
        const bucketName = process.env.BUCKET_NAME;
        if (!bucketName) {
            throw new WorkerAgentServiceError(500, "missing_bucket_name", "BUCKET_NAME is required");
        }
        const eventType = "video.analysis.requested";
        const workerEvent = (0, exports.buildWorkerInboundEvent)({
            eventType,
            correlationId: payload.correlationId || String(job._id),
            traceId: payload.traceId,
            maxAttempts: payload.maxAttempts,
            idempotencyKey: createIdempotencyKey({
                tenant: "victorycraft",
                eventType,
                businessEntityId: videoId,
            }),
            payload: buildDefaultPayload({
                videoId,
                jobId: String(job._id),
                prompt: payload.prompt,
                videoS3Uri,
                outputS3Prefix,
                localJobDir,
                uploadBucket: bucketName,
                overrides: payload,
            }),
        });
        const response = yield (0, workerAgentSqsService_1.sendWorkerEvent)(workerEvent);
        const updated = yield AnalysisJob_1.default.findByIdAndUpdate(job._id, {
            sqsMessageId: response.messageId,
            workerEventId: workerEvent.eventId,
            workerRequestId: workerEvent.tracing.requestId,
            workerCorrelationId: workerEvent.tracing.correlationId,
            workerTraceId: workerEvent.tracing.traceId,
            workerIdempotencyKey: workerEvent.idempotencyKey,
        }, { new: true });
        try {
            yield (0, notificationService_1.createNotification)({
                type: "analysis_queued",
                message: `Analysis job queued for external worker. video=${videoId}`,
                videoId,
                analysisJobId: String(job._id),
                metadata: Object.assign({ analysisType, status: "queued" }, buildAgentNotificationMetadata({
                    stage: "queued",
                    eventType,
                    requestId: workerEvent.tracing.requestId,
                    correlationId: workerEvent.tracing.correlationId,
                    traceId: workerEvent.tracing.traceId,
                    eventId: workerEvent.eventId,
                    idempotencyKey: workerEvent.idempotencyKey,
                })),
            });
        }
        catch (notificationError) {
            console.error("Failed to create queue notification:", notificationError.message);
        }
        return Object.assign(Object.assign({}, ((updated === null || updated === void 0 ? void 0 : updated.toObject()) || job.toObject())), { workerEvent });
    }
    catch (error) {
        const failed = yield AnalysisJob_1.default.findByIdAndUpdate(job._id, { status: "failed", errorMessage: error.message }, { new: true });
        try {
            yield (0, notificationService_1.createNotification)({
                type: "analysis_failed",
                message: `Failed to enqueue worker analysis job for video ${videoId}`,
                videoId,
                analysisJobId: String(job._id),
                metadata: Object.assign({ reason: error.message }, buildAgentNotificationMetadata({
                    stage: "enqueue_failed",
                })),
            });
        }
        catch (notificationError) {
            console.error("Failed to create enqueue error notification:", notificationError.message);
        }
        throw new WorkerAgentServiceError(500, "worker_enqueue_failed", (failed === null || failed === void 0 ? void 0 : failed.errorMessage) || "Failed to enqueue worker analysis job");
    }
});
exports.createWorkerVideoAnalysisJob = createWorkerVideoAnalysisJob;
const interpretWorkerResult = (message) => {
    const result = workerAgentContracts_1.workerResultEventSchema.parse(message);
    return {
        result,
        requestId: result.output.requestId,
        correlationId: result.output.correlationId,
        executionId: result.executionId,
        status: result.status,
    };
};
exports.interpretWorkerResult = interpretWorkerResult;
const applyWorkerResultToAnalysisJob = (resultEvent) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = workerAgentContracts_1.workerResultEventSchema.parse(resultEvent);
    const requestId = parsed.output.requestId;
    const correlationId = parsed.output.correlationId;
    if (!requestId && !correlationId) {
        throw new WorkerAgentServiceError(400, "missing_result_correlation", "Worker result must include output.requestId or output.correlationId");
    }
    const job = yield AnalysisJob_1.default.findOne({
        $or: [
            ...(requestId ? [{ workerRequestId: requestId }] : []),
            ...(correlationId ? [{ workerCorrelationId: correlationId }] : []),
        ],
    });
    if (!job) {
        throw new WorkerAgentServiceError(404, "analysis_job_not_found", `No analysis job found for requestId=${requestId || "n/a"} correlationId=${correlationId || "n/a"}`);
    }
    const newStatus = mapWorkerResultToJobStatus(parsed.status);
    try {
        yield (0, notificationService_1.createNotification)({
            type: "info",
            message: `Worker result received for analysis job ${String(job._id)}`,
            videoId: String(job.videoId),
            analysisJobId: String(job._id),
            metadata: buildAgentNotificationMetadata({
                stage: "result_received",
                requestId,
                correlationId,
                executionId: parsed.executionId,
                resultId: parsed.resultId,
                workerStatus: parsed.status,
                summary: parsed.summary,
            }),
        });
    }
    catch (notificationError) {
        console.error("Failed to create worker result received notification:", notificationError.message);
    }
    const updated = yield AnalysisJob_1.default.findByIdAndUpdate(job._id, {
        status: newStatus,
        output: parsed.output,
        errorMessage: parsed.status === "FAILED" ? parsed.summary : undefined,
        completedAt: new Date(),
        workerExecutionId: parsed.executionId,
        workerResultId: parsed.resultId,
        workerResultStatus: parsed.status,
    }, { new: true });
    try {
        yield (0, videoAnalysisRecordService_1.createVideoAnalysisRecord)({
            videoId: String(job.videoId),
            analysisJobId: String(job._id),
            analysisType: job.analysisType,
            input: job.input || {},
            output: parsed.output || {},
            extraParams: {
                source: "mcp_worker_agent",
                summary: parsed.summary,
                executionId: parsed.executionId,
                resultId: parsed.resultId,
                requestId,
                correlationId,
            },
        });
    }
    catch (recordError) {
        console.error("Failed to create video analysis record:", recordError.message);
    }
    try {
        yield (0, notificationService_1.createNotification)({
            type: parsed.status === "FAILED" ? "analysis_failed" : "analysis_completed",
            message: parsed.summary,
            videoId: String(job.videoId),
            analysisJobId: String(job._id),
            metadata: Object.assign({ status: parsed.status }, buildAgentNotificationMetadata({
                stage: parsed.status === "FAILED" ? "failed" : parsed.status === "PARTIAL_SUCCESS" ? "partial_success" : "completed",
                requestId,
                correlationId,
                executionId: parsed.executionId,
                resultId: parsed.resultId,
                workerStatus: parsed.status,
                summary: parsed.summary,
            })),
        });
    }
    catch (notificationError) {
        console.error("Failed to create worker result notification:", notificationError.message);
    }
    return (updated === null || updated === void 0 ? void 0 : updated.toObject()) || updated;
});
exports.applyWorkerResultToAnalysisJob = applyWorkerResultToAnalysisJob;
//# sourceMappingURL=workerAgentService.js.map