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
exports.pollAnalysisJobsQueueOnce = exports.processAnalysisJobQueueMessage = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const AnalysisJob_1 = __importDefault(require("../models/AnalysisJob"));
const aiAnalysisService_1 = require("./aiAnalysisService");
const notificationService_1 = require("./notificationService");
const queueService_1 = require("./queueService");
const Video_1 = __importDefault(require("../models/Video"));
const videoAnalysisRecordService_1 = require("./videoAnalysisRecordService");
const toJobError = (error) => ((error === null || error === void 0 ? void 0 : error.message) ? String(error.message) : "Unknown error");
const isValidObjectId = (value) => Boolean(value && mongoose_1.default.Types.ObjectId.isValid(value));
const parseQueueMessage = (body) => {
    const parsed = JSON.parse(body);
    if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid queue message body");
    }
    return parsed;
};
const processAnalysisJobQueueMessage = (message) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!isValidObjectId(message.jobId) || !isValidObjectId(message.videoId)) {
        throw new Error("Invalid jobId or videoId in message");
    }
    const job = yield AnalysisJob_1.default.findById(message.jobId);
    if (!job) {
        throw new Error(`Analysis job not found for id ${message.jobId}`);
    }
    const prompt = (_a = message.input) === null || _a === void 0 ? void 0 : _a.prompt;
    const sportTypeOverride = (_b = message.input) === null || _b === void 0 ? void 0 : _b.sportType;
    if (!prompt || !prompt.trim()) {
        yield AnalysisJob_1.default.findByIdAndUpdate(message.jobId, {
            status: "failed",
            errorMessage: "Missing prompt in queue message",
            completedAt: new Date(),
        });
        yield (0, notificationService_1.createNotification)({
            type: "analysis_failed",
            message: `Analysis job ${message.jobId} failed: missing prompt`,
            videoId: message.videoId,
            analysisJobId: message.jobId,
            metadata: { reason: "missing_prompt" },
        });
        return;
    }
    yield AnalysisJob_1.default.findByIdAndUpdate(message.jobId, {
        status: "in_progress",
        startedAt: new Date(),
    });
    try {
        if (sportTypeOverride) {
            yield Video_1.default.findByIdAndUpdate(message.videoId, { sportType: sportTypeOverride });
        }
        const analysisOutput = yield (0, aiAnalysisService_1.analyzeVideoWithPrompt)(message.videoId, prompt, sportTypeOverride, message.jobId);
        yield AnalysisJob_1.default.findByIdAndUpdate(message.jobId, {
            status: "completed",
            output: analysisOutput,
            completedAt: new Date(),
            errorMessage: undefined,
        });
        yield (0, videoAnalysisRecordService_1.createVideoAnalysisRecord)({
            videoId: message.videoId,
            analysisJobId: message.jobId,
            analysisType: message.analysisType,
            input: message.input || {},
            output: analysisOutput || {},
            extraParams: {
                source: "sqs_worker",
            },
        });
        yield (0, notificationService_1.createNotification)({
            type: "analysis_completed",
            message: `Analysis job ${message.jobId} completed successfully`,
            videoId: message.videoId,
            analysisJobId: message.jobId,
            metadata: {
                analysisType: message.analysisType,
                status: "completed",
            },
        });
    }
    catch (error) {
        const reason = toJobError(error);
        yield AnalysisJob_1.default.findByIdAndUpdate(message.jobId, {
            status: "failed",
            errorMessage: reason,
            completedAt: new Date(),
        });
        yield (0, notificationService_1.createNotification)({
            type: "analysis_failed",
            message: `Analysis job ${message.jobId} failed`,
            videoId: message.videoId,
            analysisJobId: message.jobId,
            metadata: {
                analysisType: message.analysisType,
                status: "failed",
                reason,
            },
        });
    }
});
exports.processAnalysisJobQueueMessage = processAnalysisJobQueueMessage;
const pollAnalysisJobsQueueOnce = () => __awaiter(void 0, void 0, void 0, function* () {
    const messages = yield (0, queueService_1.receiveAnalysisJobsMessages)({
        maxNumberOfMessages: 5,
        waitTimeSeconds: 20,
        visibilityTimeout: 90,
    });
    for (const rawMessage of messages) {
        const receiptHandle = rawMessage.ReceiptHandle;
        try {
            const parsed = parseQueueMessage(rawMessage.Body || "{}");
            yield (0, exports.processAnalysisJobQueueMessage)(parsed);
        }
        catch (error) {
            console.error("Error processing queue message:", error.message);
        }
        finally {
            if (receiptHandle) {
                try {
                    yield (0, queueService_1.deleteAnalysisJobsMessage)(receiptHandle);
                }
                catch (deleteError) {
                    console.error("Error deleting SQS message:", deleteError.message);
                }
            }
        }
    }
});
exports.pollAnalysisJobsQueueOnce = pollAnalysisJobsQueueOnce;
//# sourceMappingURL=analysisJobsConsumerService.js.map