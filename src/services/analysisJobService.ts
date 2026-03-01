import mongoose from "mongoose";
import AnalysisJob from "../models/AnalysisJob";
import Video from "../models/Video";
import { createNotification } from "./notificationService";
import { sendAnalysisJobToQueue } from "./queueService";

type AnalyzePromptInput = {
  analysisType?: "agent_prompt" | "custom";
  prompt?: string;
  sportType?: "football" | "padel" | "tennis" | "basketball" | "other";
  input?: Record<string, any>;
};

export class AnalysisJobServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const validateAnalyzePromptInput = (videoId: string, payload: AnalyzePromptInput) => {
  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new AnalysisJobServiceError(400, "invalid_video_id", "Video id is invalid");
  }

  const analysisType = payload.analysisType || "agent_prompt";
  if (!["agent_prompt", "custom"].includes(analysisType)) {
    throw new AnalysisJobServiceError(
      400,
      "invalid_analysis_type",
      "analysisType must be agent_prompt or custom",
    );
  }

  if (analysisType === "agent_prompt" && (!payload.prompt || !payload.prompt.trim())) {
    throw new AnalysisJobServiceError(400, "invalid_prompt", "prompt is required for agent_prompt");
  }
};

export const createPromptAnalysisJob = async (
  videoId: string,
  payload: AnalyzePromptInput,
) => {
  validateAnalyzePromptInput(videoId, payload);

  const videoExists = await Video.exists({ _id: videoId });
  if (!videoExists) {
    throw new AnalysisJobServiceError(404, "video_not_found", "Video not found");
  }

  const analysisType = payload.analysisType || "agent_prompt";
  const input = {
    prompt: payload.prompt || "",
    ...(payload.sportType ? { sportType: payload.sportType } : {}),
    ...(payload.input || {}),
  };

  const job = await AnalysisJob.create({
    videoId,
    analysisType,
    status: "queued",
    input,
  });

  try {
    const messageId = await sendAnalysisJobToQueue({
      jobId: String(job._id),
      videoId,
      analysisType,
      input,
      createdAt: job.createdAt,
    });

    const updated = await AnalysisJob.findByIdAndUpdate(
      job._id,
      { sqsMessageId: messageId, status: "queued" },
      { new: true },
    );

    await createNotification({
      type: "analysis_queued",
      message: `Analysis job queued for video ${videoId}`,
      videoId,
      analysisJobId: String(job._id),
      metadata: { analysisType, status: "queued" },
    });

    return updated?.toObject() || job.toObject();
  } catch (error: any) {
    const failed = await AnalysisJob.findByIdAndUpdate(
      job._id,
      { status: "failed", errorMessage: error.message },
      { new: true },
    );

    await createNotification({
      type: "analysis_failed",
      message: `Failed to queue analysis job for video ${videoId}`,
      videoId,
      analysisJobId: String(job._id),
      metadata: { reason: error.message },
    });

    throw new AnalysisJobServiceError(
      500,
      "queue_enqueue_failed",
      failed?.errorMessage || "Failed to enqueue analysis job",
    );
  }
};

export const getAnalysisJobStatus = async (videoId: string, jobId: string) => {
  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new AnalysisJobServiceError(400, "invalid_video_id", "Video id is invalid");
  }
  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    throw new AnalysisJobServiceError(400, "invalid_job_id", "Job id is invalid");
  }

  const job = await AnalysisJob.findOne({ _id: jobId, videoId });
  if (!job) {
    throw new AnalysisJobServiceError(404, "job_not_found", "Analysis job not found");
  }

  return job.toObject();
};
