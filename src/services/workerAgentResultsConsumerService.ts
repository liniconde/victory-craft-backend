import {
  applyWorkerResultToAnalysisJob,
} from "./workerAgentService";
import {
  deleteWorkerResultMessage,
  parseWorkerResultMessage,
  receiveWorkerResultMessages,
} from "./workerAgentSqsService";

export const pollWorkerResultsQueueOnce = async () => {
  const messages = await receiveWorkerResultMessages({
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

      const parsed = parseWorkerResultMessage(rawMessage.Body || "{}");
      console.log("[worker-agent-results-consumer] message.processing.parsed", {
        messageId: rawMessage.MessageId,
        eventId: parsed.eventId,
        requestId: parsed.output.requestId,
        correlationId: parsed.output.correlationId,
        executionId: parsed.executionId,
        resultId: parsed.resultId,
        status: parsed.status,
      });

      await applyWorkerResultToAnalysisJob(parsed);
      shouldDelete = true;

      console.log("[worker-agent-results-consumer] message.processing.applied", {
        messageId: rawMessage.MessageId,
        eventId: parsed.eventId,
        requestId: parsed.output.requestId,
        correlationId: parsed.output.correlationId,
      });
    } catch (error: any) {
      console.error("Error processing worker result message:", {
        messageId: rawMessage.MessageId,
        error: error.message,
      });
    } finally {
      if (receiptHandle && shouldDelete) {
        try {
          await deleteWorkerResultMessage(receiptHandle);
          console.log("[worker-agent-results-consumer] message.deleted", {
            messageId: rawMessage.MessageId,
          });
        } catch (deleteError: any) {
          console.error("Error deleting worker result SQS message:", {
            messageId: rawMessage.MessageId,
            error: deleteError.message,
          });
        }
      } else if (!shouldDelete) {
        console.warn("[worker-agent-results-consumer] message.not_deleted", {
          messageId: rawMessage.MessageId,
          reason: "processing_failed_or_not_applied",
        });
      }
    }
  }
};
