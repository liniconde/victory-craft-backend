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
    for (const rawMessage of messages) {
        const receiptHandle = rawMessage.ReceiptHandle;
        let shouldDelete = false;
        try {
            const parsed = (0, workerAgentSqsService_1.parseWorkerResultMessage)(rawMessage.Body || "{}");
            yield (0, workerAgentService_1.applyWorkerResultToAnalysisJob)(parsed);
            shouldDelete = true;
        }
        catch (error) {
            console.error("Error processing worker result message:", error.message);
        }
        finally {
            if (receiptHandle && shouldDelete) {
                try {
                    yield (0, workerAgentSqsService_1.deleteWorkerResultMessage)(receiptHandle);
                }
                catch (deleteError) {
                    console.error("Error deleting worker result SQS message:", deleteError.message);
                }
            }
        }
    }
});
exports.pollWorkerResultsQueueOnce = pollWorkerResultsQueueOnce;
//# sourceMappingURL=workerAgentResultsConsumerService.js.map