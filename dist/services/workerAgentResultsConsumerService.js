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
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollWorkerResultsQueueOnce = void 0;
const workerAgentService_1 = require("./workerAgentService");
const workerAgentSqsService_1 = require("./workerAgentSqsService");
const pollWorkerResultsQueueOnce = () => __awaiter(void 0, void 0, void 0, function* () {
    const messages = yield (0, workerAgentSqsService_1.receiveWorkerResultMessages)({
        maxNumberOfMessages: 5,
        waitTimeSeconds: 20,
        visibilityTimeout: 90,
    });
    console.log("[worker-agent-results-consumer] poll.batch", {
        count: messages.length,
        messageIds: messages.map((message) => message.MessageId).filter(Boolean),
    });
    for (const rawMessage of messages) {
        const receiptHandle = rawMessage.ReceiptHandle;
        let shouldDelete = false;
        try {
            console.log("[worker-agent-results-consumer] message.processing.start", {
                messageId: rawMessage.MessageId,
                hasBody: Boolean(rawMessage.Body),
            });
            const parsed = (0, workerAgentSqsService_1.parseWorkerResultMessage)(rawMessage.Body || "{}");
            console.log("[worker-agent-results-consumer] message.processing.parsed", {
                messageId: rawMessage.MessageId,
                eventId: parsed.eventId,
                requestId: parsed.output.requestId,
                correlationId: parsed.output.correlationId,
                executionId: parsed.executionId,
                resultId: parsed.resultId,
                status: parsed.status,
            });
            yield (0, workerAgentService_1.applyWorkerResultToAnalysisJob)(parsed);
            shouldDelete = true;
            console.log("[worker-agent-results-consumer] message.processing.applied", {
                messageId: rawMessage.MessageId,
                eventId: parsed.eventId,
                requestId: parsed.output.requestId,
                correlationId: parsed.output.correlationId,
            });
        }
        catch (error) {
            console.error("Error processing worker result message:", {
                messageId: rawMessage.MessageId,
                error: error.message,
            });
        }
        finally {
            if (receiptHandle && shouldDelete) {
                try {
                    yield (0, workerAgentSqsService_1.deleteWorkerResultMessage)(receiptHandle);
                    console.log("[worker-agent-results-consumer] message.deleted", {
                        messageId: rawMessage.MessageId,
                    });
                }
                catch (deleteError) {
                    console.error("Error deleting worker result SQS message:", {
                        messageId: rawMessage.MessageId,
                        error: deleteError.message,
                    });
                }
            }
            else if (!shouldDelete) {
                console.warn("[worker-agent-results-consumer] message.not_deleted", {
                    messageId: rawMessage.MessageId,
                    reason: "processing_failed_or_not_applied",
                });
            }
        }
    }
});
exports.pollWorkerResultsQueueOnce = pollWorkerResultsQueueOnce;
//# sourceMappingURL=workerAgentResultsConsumerService.js.map