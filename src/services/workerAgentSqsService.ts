import dotenv from "dotenv";
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import {
  WorkerInboundEvent,
  WorkerResultEvent,
  workerInboundEventSchema,
  workerResultEventSchema,
} from "../contracts/workerAgentContracts";

dotenv.config();

let sqsClient: SQSClient | null = null;

const logWorkerSqs = (stage: string, metadata: Record<string, unknown> = {}) => {
  console.log(`[worker-agent-sqs] ${stage}`, metadata);
};

const getSqsClient = () => {
  if (sqsClient) {
    return sqsClient;
  }

  const region = process.env.AWS_REGION;
  if (!region) {
    throw new Error("AWS_REGION is not configured");
  }

  sqsClient = new SQSClient({
    region,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });

  return sqsClient;
};

const getRequiredQueueUrl = (envName: "MCP_WORKER_AGENT_JOBS_SQS_URL" | "MCP_WORKER_AGENT_RESULTS_SQS_URL") => {
  const queueUrl = process.env[envName];
  if (!queueUrl) {
    throw new Error(`${envName} is not configured`);
  }
  return queueUrl;
};

export const sendWorkerEvent = async (
  event: WorkerInboundEvent,
): Promise<{ messageId: string }> => {
  const parsedEvent = workerInboundEventSchema.parse(event);
  const queueUrl = getRequiredQueueUrl("MCP_WORKER_AGENT_JOBS_SQS_URL");

  logWorkerSqs("send.start", {
    queueUrl,
    eventId: parsedEvent.eventId,
    eventType: parsedEvent.eventType,
    requestId: parsedEvent.tracing.requestId,
    correlationId: parsedEvent.tracing.correlationId,
    traceId: parsedEvent.tracing.traceId,
    idempotencyKey: parsedEvent.idempotencyKey,
  });

  const response = await getSqsClient().send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(parsedEvent),
    }),
  );

  if (!response.MessageId) {
    throw new Error("SQS did not return a message id");
  }

  logWorkerSqs("send.success", {
    queueUrl,
    messageId: response.MessageId,
    eventId: parsedEvent.eventId,
    requestId: parsedEvent.tracing.requestId,
    correlationId: parsedEvent.tracing.correlationId,
  });

  return { messageId: response.MessageId };
};

export const receiveWorkerResultMessages = async (params?: {
  maxNumberOfMessages?: number;
  waitTimeSeconds?: number;
  visibilityTimeout?: number;
}) => {
  const queueUrl = getRequiredQueueUrl("MCP_WORKER_AGENT_RESULTS_SQS_URL");
  const maxNumberOfMessages = params?.maxNumberOfMessages || 5;
  const waitTimeSeconds = params?.waitTimeSeconds || 20;
  const visibilityTimeout = params?.visibilityTimeout || 60;

  logWorkerSqs("receive.poll.start", {
    queueUrl,
    maxNumberOfMessages,
    waitTimeSeconds,
    visibilityTimeout,
  });

  const response = await getSqsClient().send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxNumberOfMessages,
      WaitTimeSeconds: waitTimeSeconds,
      VisibilityTimeout: visibilityTimeout,
      MessageAttributeNames: ["All"],
    }),
  );

  const messages = response.Messages || [];

  logWorkerSqs("receive.poll.done", {
    queueUrl,
    receivedCount: messages.length,
    messageIds: messages.map((message) => message.MessageId).filter(Boolean),
  });

  return messages;
};

export const deleteWorkerResultMessage = async (receiptHandle: string) => {
  if (!receiptHandle) {
    throw new Error("receiptHandle is required");
  }

  const queueUrl = getRequiredQueueUrl("MCP_WORKER_AGENT_RESULTS_SQS_URL");
  logWorkerSqs("delete.start", {
    queueUrl,
    receiptHandlePreview: receiptHandle.slice(0, 12),
  });

  await getSqsClient().send(
    new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    }),
  );

  logWorkerSqs("delete.success", {
    queueUrl,
    receiptHandlePreview: receiptHandle.slice(0, 12),
  });
};

export const parseWorkerResultMessage = (body: string): WorkerResultEvent => {
  logWorkerSqs("receive.parse.start", {
    bodyLength: body?.length || 0,
  });

  const parsed = JSON.parse(body);
  const validated = workerResultEventSchema.parse(parsed);

  logWorkerSqs("receive.parse.success", {
    eventId: validated.eventId,
    eventType: validated.eventType,
    executionId: validated.executionId,
    resultId: validated.resultId,
    status: validated.status,
    requestId: validated.output.requestId,
    correlationId: validated.output.correlationId,
  });

  return validated;
};
