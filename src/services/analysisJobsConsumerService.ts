import mongoose from "mongoose";
import AnalysisJob from "../models/AnalysisJob";
import { analyzeVideoWithPrompt } from "./aiAnalysisService";
import { createNotification } from "./notificationService";
import {
  deleteAnalysisJobsMessage,
  receiveAnalysisJobsMessages,
} from "./queueService";
import Video from "../models/Video";
import { createVideoAnalysisRecord } from "./videoAnalysisRecordService";

export type AnalysisJobQueueMessage = {
  jobId: string;
  videoId: string;
  analysisType: "agent_prompt" | "custom";
  input?: {
    prompt?: string;
    sportType?: "football" | "padel" | "tennis" | "basketball" | "other";
    [key: string]: any;
  };
  createdAt?: string;
};

const toJobError = (error: any) => (error?.message ? String(error.message) : "Unknown error");

const isValidObjectId = (value: string) => Boolean(value && mongoose.Types.ObjectId.isValid(value));

const parseQueueMessage = (body: string): AnalysisJobQueueMessage => {
  const parsed = JSON.parse(body);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid queue message body");
  }
  return parsed;
};

export const processAnalysisJobQueueMessage = async (
  message: AnalysisJobQueueMessage,
) => {
  if (!isValidObjectId(message.jobId) || !isValidObjectId(message.videoId)) {
    throw new Error("Invalid jobId or videoId in message");
  }

  const job = await AnalysisJob.findById(message.jobId);
  if (!job) {
    throw new Error(`Analysis job not found for id ${message.jobId}`);
  }

  const prompt = message.input?.prompt;
  const sportTypeOverride = message.input?.sportType;
  if (!prompt || !prompt.trim()) {
    await AnalysisJob.findByIdAndUpdate(message.jobId, {
      status: "failed",
      errorMessage: "Missing prompt in queue message",
      completedAt: new Date(),
    });
    await createNotification({
      type: "analysis_failed",
      message: `Analysis job ${message.jobId} failed: missing prompt`,
      videoId: message.videoId,
      analysisJobId: message.jobId,
      metadata: { reason: "missing_prompt" },
    });
    return;
  }

  await AnalysisJob.findByIdAndUpdate(message.jobId, {
    status: "in_progress",
    startedAt: new Date(),
  });

  try {
    if (sportTypeOverride) {
      await Video.findByIdAndUpdate(message.videoId, { sportType: sportTypeOverride });
    }
    const analysisOutput = await analyzeVideoWithPrompt(
      message.videoId,
      prompt,
      sportTypeOverride,
      message.jobId,
    );

    await AnalysisJob.findByIdAndUpdate(message.jobId, {
      status: "completed",
      output: analysisOutput,
      completedAt: new Date(),
      errorMessage: undefined,
    });

    await createVideoAnalysisRecord({
      videoId: message.videoId,
      analysisJobId: message.jobId,
      analysisType: message.analysisType,
      input: message.input || {},
      output: analysisOutput || {},
      extraParams: {
        source: "sqs_worker",
      },
    });

    await createNotification({
      type: "analysis_completed",
      message: `Analysis job ${message.jobId} completed successfully`,
      videoId: message.videoId,
      analysisJobId: message.jobId,
      metadata: {
        analysisType: message.analysisType,
        status: "completed",
      },
    });
  } catch (error: any) {
    const reason = toJobError(error);
    await AnalysisJob.findByIdAndUpdate(message.jobId, {
      status: "failed",
      errorMessage: reason,
      completedAt: new Date(),
    });

    await createNotification({
      type: "analysis_failed",
      message: `Analysis job ${message.jobId} failed`,
      videoId: message.videoId,
      analysisJobId: message.jobId,
      metadata: {
        analysisType: message.analysisType,
        status: "failed",
        reason,
      },
    });
  }
};

export const pollAnalysisJobsQueueOnce = async () => {
  const messages = await receiveAnalysisJobsMessages({
    maxNumberOfMessages: 5,
    waitTimeSeconds: 20,
    visibilityTimeout: 90,
  });

  for (const rawMessage of messages) {
    const receiptHandle = rawMessage.ReceiptHandle;
    try {
      const parsed = parseQueueMessage(rawMessage.Body || "{}");
      await processAnalysisJobQueueMessage(parsed);
    } catch (error: any) {
      console.error("Error processing queue message:", error.message);
    } finally {
      if (receiptHandle) {
        try {
          await deleteAnalysisJobsMessage(receiptHandle);
        } catch (deleteError: any) {
          console.error("Error deleting SQS message:", deleteError.message);
        }
      }
    }
  }
};
