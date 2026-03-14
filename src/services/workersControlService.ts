import AWS from "aws-sdk";

export class WorkersControlServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type StartWorkersInput = {
  requestedBy: string;
  reason?: string;
  metadata?: Record<string, any>;
};

const sqs = new AWS.SQS({
  region: process.env.AWS_REGION,
});

const getWorkersStartQueueUrl = () => {
  const queueUrl =
    process.env.WORKERS_MANUAL_START_SQS_URL ||
    process.env.WORKERS_START_TRIGGER_SQS_URL;

  if (!queueUrl) {
    throw new WorkersControlServiceError(
      500,
      "workers_start_queue_missing",
      "Workers start queue url is not configured",
    );
  }

  return queueUrl;
};

export const enqueueWorkersStart = async (input: StartWorkersInput) => {
  if (!input.requestedBy || !input.requestedBy.trim()) {
    throw new WorkersControlServiceError(
      400,
      "invalid_requested_by",
      "requestedBy is required",
    );
  }

  const queueUrl = getWorkersStartQueueUrl();
  const body = {
    requestedBy: input.requestedBy,
    reason: input.reason || "manual_start",
    metadata: input.metadata || {},
    requestedAt: new Date().toISOString(),
  };

  const response = await sqs
    .sendMessage({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(body),
    })
    .promise();

  if (!response.MessageId) {
    throw new WorkersControlServiceError(
      502,
      "workers_start_enqueue_failed",
      "SQS did not return message id",
    );
  }

  return {
    queueUrl,
    messageId: response.MessageId,
    payload: body,
  };
};
