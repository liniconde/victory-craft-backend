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
  const response = await getSqsClient().send(
    new SendMessageCommand({
      QueueUrl: getRequiredQueueUrl("MCP_WORKER_AGENT_JOBS_SQS_URL"),
      MessageBody: JSON.stringify(parsedEvent),
    }),
  );

  if (!response.MessageId) {
    throw new Error("SQS did not return a message id");
  }

  return { messageId: response.MessageId };
};

export const receiveWorkerResultMessages = async (params?: {
  maxNumberOfMessages?: number;
  waitTimeSeconds?: number;
  visibilityTimeout?: number;
}) => {
  const response = await getSqsClient().send(
    new ReceiveMessageCommand({
      QueueUrl: getRequiredQueueUrl("MCP_WORKER_AGENT_RESULTS_SQS_URL"),
      MaxNumberOfMessages: params?.maxNumberOfMessages || 5,
      WaitTimeSeconds: params?.waitTimeSeconds || 20,
      VisibilityTimeout: params?.visibilityTimeout || 60,
      MessageAttributeNames: ["All"],
    }),
  );

  return response.Messages || [];
};

export const deleteWorkerResultMessage = async (receiptHandle: string) => {
  if (!receiptHandle) {
    throw new Error("receiptHandle is required");
  }

  await getSqsClient().send(
    new DeleteMessageCommand({
      QueueUrl: getRequiredQueueUrl("MCP_WORKER_AGENT_RESULTS_SQS_URL"),
      ReceiptHandle: receiptHandle,
    }),
  );
};

export const parseWorkerResultMessage = (body: string): WorkerResultEvent => {
  const parsed = JSON.parse(body);
  return workerResultEventSchema.parse(parsed);
};
