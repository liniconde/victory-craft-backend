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

  for (const rawMessage of messages) {
    const receiptHandle = rawMessage.ReceiptHandle;
    let shouldDelete = false;
    try {
      const parsed = parseWorkerResultMessage(rawMessage.Body || "{}");
      await applyWorkerResultToAnalysisJob(parsed);
      shouldDelete = true;
    } catch (error: any) {
      console.error("Error processing worker result message:", error.message);
    } finally {
      if (receiptHandle && shouldDelete) {
        try {
          await deleteWorkerResultMessage(receiptHandle);
        } catch (deleteError: any) {
          console.error("Error deleting worker result SQS message:", deleteError.message);
        }
      }
    }
  }
};
