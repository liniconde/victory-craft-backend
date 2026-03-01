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
