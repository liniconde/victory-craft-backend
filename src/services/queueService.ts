import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

const sqs = new AWS.SQS({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const sendAnalysisJobToQueue = async (payload: Record<string, any>) => {
  const queueUrl = process.env.ANALYSIS_JOBS_SQS_URL;
  if (!queueUrl) {
    throw new Error("ANALYSIS_JOBS_SQS_URL is not configured");
  }

  const response = await sqs
    .sendMessage({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(payload),
    })
    .promise();

  return response.MessageId || "";
};

export const receiveAnalysisJobsMessages = async (params?: {
  maxNumberOfMessages?: number;
  waitTimeSeconds?: number;
  visibilityTimeout?: number;
}) => {
  const queueUrl = process.env.ANALYSIS_JOBS_SQS_URL;
  if (!queueUrl) {
    throw new Error("ANALYSIS_JOBS_SQS_URL is not configured");
  }

  const response = await sqs
    .receiveMessage({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: params?.maxNumberOfMessages || 5,
      WaitTimeSeconds: params?.waitTimeSeconds || 20,
      VisibilityTimeout: params?.visibilityTimeout || 60,
      MessageAttributeNames: ["All"],
    })
    .promise();

  return response.Messages || [];
};

export const deleteAnalysisJobsMessage = async (receiptHandle: string) => {
  const queueUrl = process.env.ANALYSIS_JOBS_SQS_URL;
  if (!queueUrl) {
    throw new Error("ANALYSIS_JOBS_SQS_URL is not configured");
  }
  if (!receiptHandle) {
    throw new Error("receiptHandle is required");
  }

  await sqs
    .deleteMessage({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    })
    .promise();
};
