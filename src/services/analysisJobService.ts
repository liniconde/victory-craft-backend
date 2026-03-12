import mongoose from "mongoose";
import AnalysisJob from "../models/AnalysisJob";
import Video from "../models/Video";
import { createNotification } from "./notificationService";
import { sendAnalysisJobToQueue } from "./queueService";
import {
  DEFAULT_WORKER_AGENT_MESSAGE,
  createWorkerVideoAnalysisJob,
} from "./workerAgentService";

type AnalyzePromptInput = {
  analysisType?: "agent_prompt" | "custom";
  prompt?: string;
  sportType?: "football" | "padel" | "tennis" | "basketball" | "other";
  input?: Record<string, any>;
  correlationId?: string;
  traceId?: string;
  maxAttempts?: number;
  outputS3Prefix?: string;
  localJobDir?: string;
  render?: Record<string, any>;
  stats?: Record<string, any>;
  upload?: Record<string, any>;
  analysis?: Record<string, any>;
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

export const createAgentPromptAnalysisJob = async (
  videoId: string,
  payload: AnalyzePromptInput,
) => {
  validateAnalyzePromptInput(videoId, payload);

  return createWorkerVideoAnalysisJob(videoId, payload);
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

  const raw = job.toObject();
  const output =
    raw.output && typeof raw.output === "object" ? (raw.output as Record<string, any>) : {};

  const resolvedAgentMessage =
    (typeof output.agentMessage === "string" && output.agentMessage.trim()) ||
    (typeof raw.workerAgentMessage === "string" && raw.workerAgentMessage.trim()) ||
    (typeof raw.workerSummary === "string" && raw.workerSummary.trim()) ||
    DEFAULT_WORKER_AGENT_MESSAGE;

  const artifacts =
    (Array.isArray(output.artifacts) && output.artifacts) ||
    (Array.isArray(raw.artifacts) && raw.artifacts) ||
    [];

  const toolOutputs = Array.isArray(output.toolOutputs) ? output.toolOutputs : [];
  const technicalErrors = toolOutputs
    .map((item) => {
      const row = item as Record<string, any>;
      if (!row || typeof row !== "object") {
        return null;
      }

      const hasExplicitFailure = row.ok === false || Boolean(row.error);
      if (!hasExplicitFailure) {
        return null;
      }

      return {
        toolName: typeof row.toolName === "string" ? row.toolName : undefined,
        code:
          row.error && typeof row.error === "object" && typeof row.error.code === "string"
            ? row.error.code
            : undefined,
        message:
          row.error && typeof row.error === "object" && typeof row.error.message === "string"
            ? row.error.message
            : undefined,
      };
    })
    .filter(Boolean);

  return {
    ...raw,
    execution: {
      id: raw.workerExecutionId || null,
      requestId: raw.workerRequestId || output.requestId || null,
      correlationId: raw.workerCorrelationId || output.correlationId || null,
      result: {
        id: raw.workerResultId || null,
        status: raw.workerResultStatus || null,
        summary: raw.workerSummary || raw.errorMessage || null,
        agentMessage: resolvedAgentMessage,
        artifacts,
        technicalErrors:
          raw.workerResultStatus === "PARTIAL_SUCCESS" || raw.workerResultStatus === "FAILED"
            ? technicalErrors
            : [],
      },
    },
  };
};
