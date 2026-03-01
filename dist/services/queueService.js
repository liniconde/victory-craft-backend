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
exports.deleteAnalysisJobsMessage = exports.receiveAnalysisJobsMessages = exports.sendAnalysisJobToQueue = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const sqs = new aws_sdk_1.default.SQS({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const sendAnalysisJobToQueue = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const queueUrl = process.env.ANALYSIS_JOBS_SQS_URL;
    if (!queueUrl) {
        throw new Error("ANALYSIS_JOBS_SQS_URL is not configured");
    }
    const response = yield sqs
        .sendMessage({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(payload),
    })
        .promise();
    return response.MessageId || "";
});
exports.sendAnalysisJobToQueue = sendAnalysisJobToQueue;
const receiveAnalysisJobsMessages = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const queueUrl = process.env.ANALYSIS_JOBS_SQS_URL;
    if (!queueUrl) {
        throw new Error("ANALYSIS_JOBS_SQS_URL is not configured");
    }
    const response = yield sqs
        .receiveMessage({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: (params === null || params === void 0 ? void 0 : params.maxNumberOfMessages) || 5,
        WaitTimeSeconds: (params === null || params === void 0 ? void 0 : params.waitTimeSeconds) || 20,
        VisibilityTimeout: (params === null || params === void 0 ? void 0 : params.visibilityTimeout) || 60,
        MessageAttributeNames: ["All"],
    })
        .promise();
    return response.Messages || [];
});
exports.receiveAnalysisJobsMessages = receiveAnalysisJobsMessages;
const deleteAnalysisJobsMessage = (receiptHandle) => __awaiter(void 0, void 0, void 0, function* () {
    const queueUrl = process.env.ANALYSIS_JOBS_SQS_URL;
    if (!queueUrl) {
        throw new Error("ANALYSIS_JOBS_SQS_URL is not configured");
    }
    if (!receiptHandle) {
        throw new Error("receiptHandle is required");
    }
    yield sqs
        .deleteMessage({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
    })
        .promise();
});
exports.deleteAnalysisJobsMessage = deleteAnalysisJobsMessage;
//# sourceMappingURL=queueService.js.map