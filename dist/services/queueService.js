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
exports.sendAnalysisJobToQueue = void 0;
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
//# sourceMappingURL=queueService.js.map