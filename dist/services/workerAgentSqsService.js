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
exports.parseWorkerResultMessage = exports.deleteWorkerResultMessage = exports.receiveWorkerResultMessages = exports.sendWorkerEvent = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const client_sqs_1 = require("@aws-sdk/client-sqs");
const workerAgentContracts_1 = require("../contracts/workerAgentContracts");
dotenv_1.default.config();
let sqsClient = null;
const getSqsClient = () => {
    if (sqsClient) {
        return sqsClient;
    }
    const region = process.env.AWS_REGION;
    if (!region) {
        throw new Error("AWS_REGION is not configured");
    }
    sqsClient = new client_sqs_1.SQSClient({
        region,
        credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
            ? {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
            : undefined,
    });
    return sqsClient;
};
const getRequiredQueueUrl = (envName) => {
    const queueUrl = process.env[envName];
    if (!queueUrl) {
        throw new Error(`${envName} is not configured`);
    }
    return queueUrl;
};
const sendWorkerEvent = (event) => __awaiter(void 0, void 0, void 0, function* () {
    const parsedEvent = workerAgentContracts_1.workerInboundEventSchema.parse(event);
    const response = yield getSqsClient().send(new client_sqs_1.SendMessageCommand({
        QueueUrl: getRequiredQueueUrl("MCP_WORKER_AGENT_JOBS_SQS_URL"),
        MessageBody: JSON.stringify(parsedEvent),
    }));
    if (!response.MessageId) {
        throw new Error("SQS did not return a message id");
    }
    return { messageId: response.MessageId };
});
exports.sendWorkerEvent = sendWorkerEvent;
const receiveWorkerResultMessages = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield getSqsClient().send(new client_sqs_1.ReceiveMessageCommand({
        QueueUrl: getRequiredQueueUrl("MCP_WORKER_AGENT_RESULTS_SQS_URL"),
        MaxNumberOfMessages: (params === null || params === void 0 ? void 0 : params.maxNumberOfMessages) || 5,
        WaitTimeSeconds: (params === null || params === void 0 ? void 0 : params.waitTimeSeconds) || 20,
        VisibilityTimeout: (params === null || params === void 0 ? void 0 : params.visibilityTimeout) || 60,
        MessageAttributeNames: ["All"],
    }));
    return response.Messages || [];
});
exports.receiveWorkerResultMessages = receiveWorkerResultMessages;
const deleteWorkerResultMessage = (receiptHandle) => __awaiter(void 0, void 0, void 0, function* () {
    if (!receiptHandle) {
        throw new Error("receiptHandle is required");
    }
    yield getSqsClient().send(new client_sqs_1.DeleteMessageCommand({
        QueueUrl: getRequiredQueueUrl("MCP_WORKER_AGENT_RESULTS_SQS_URL"),
        ReceiptHandle: receiptHandle,
    }));
});
exports.deleteWorkerResultMessage = deleteWorkerResultMessage;
const parseWorkerResultMessage = (body) => {
    const parsed = JSON.parse(body);
    return workerAgentContracts_1.workerResultEventSchema.parse(parsed);
};
exports.parseWorkerResultMessage = parseWorkerResultMessage;
//# sourceMappingURL=workerAgentSqsService.js.map