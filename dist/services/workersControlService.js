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
exports.enqueueWorkersStart = exports.WorkersControlServiceError = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
class WorkersControlServiceError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.WorkersControlServiceError = WorkersControlServiceError;
const sqs = new aws_sdk_1.default.SQS({
    region: process.env.AWS_REGION,
});
const getWorkersStartQueueUrl = () => {
    const queueUrl = process.env.WORKERS_MANUAL_START_SQS_URL ||
        process.env.WORKERS_START_TRIGGER_SQS_URL;
    if (!queueUrl) {
        throw new WorkersControlServiceError(500, "workers_start_queue_missing", "Workers start queue url is not configured");
    }
    return queueUrl;
};
const enqueueWorkersStart = (input) => __awaiter(void 0, void 0, void 0, function* () {
    if (!input.requestedBy || !input.requestedBy.trim()) {
        throw new WorkersControlServiceError(400, "invalid_requested_by", "requestedBy is required");
    }
    const queueUrl = getWorkersStartQueueUrl();
    const body = {
        requestedBy: input.requestedBy,
        reason: input.reason || "manual_start",
        metadata: input.metadata || {},
        requestedAt: new Date().toISOString(),
    };
    const response = yield sqs
        .sendMessage({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(body),
    })
        .promise();
    if (!response.MessageId) {
        throw new WorkersControlServiceError(502, "workers_start_enqueue_failed", "SQS did not return message id");
    }
    return {
        queueUrl,
        messageId: response.MessageId,
        payload: body,
    };
});
exports.enqueueWorkersStart = enqueueWorkersStart;
//# sourceMappingURL=workersControlService.js.map