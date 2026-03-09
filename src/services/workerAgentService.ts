import { randomUUID } from "crypto";
import mongoose from "mongoose";
import AnalysisJob from "../models/AnalysisJob";
import Video from "../models/Video";
import {
  WorkerInboundEvent,
  WorkerResultEvent,
  WorkerResultStatus,
  WorkerVideoAnalysisPayload,
  workerResultEventSchema,
} from "../contracts/workerAgentContracts";
import { createNotification } from "./notificationService";
import { upsertAnalysisArtifacts } from "./analysisArtifactService";
import { createVideoAnalysisRecord } from "./videoAnalysisRecordService";
import { sendWorkerEvent } from "./workerAgentSqsService";

type WorkerToolConfig = {
  toolName?: string;
  outputDir?: string;
  yoloModel?: string;
  processFps?: number;
  conf?: number;
  outputPath?: string;
  bucket?: string;
  destinationPrefix?: string;
  analysisPrompt?: string;
};

type CreateWorkerVideoAnalysisJobInput = {
  analysisType?: "agent_prompt" | "custom";
  prompt?: string;
  sportType?: "football" | "padel" | "tennis" | "basketball" | "other";
  input?: Record<string, any>;
  correlationId?: string;
  traceId?: string;
  maxAttempts?: number;
  outputS3Prefix?: string;
  localJobDir?: string;
  render?: WorkerToolConfig;
  stats?: WorkerToolConfig;
  upload?: WorkerToolConfig;
  analysis?: WorkerToolConfig;
};

export class WorkerAgentServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const toObjectId = (value: string, fieldName: string) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    throw new WorkerAgentServiceError(400, `invalid_${fieldName}`, `${fieldName} is invalid`);
  }
};

const buildS3Uri = (params: { s3Url?: string; s3Key?: string }) => {
  if (params.s3Url && params.s3Url.startsWith("s3://")) {
    return params.s3Url;
  }

  const bucketName = process.env.BUCKET_NAME;
  if (!bucketName || !params.s3Key) {
    throw new WorkerAgentServiceError(
      500,
      "missing_video_s3_uri",
      "Cannot build video S3 URI. Configure BUCKET_NAME or persist s3Url as s3://bucket/key",
    );
  }

  return `s3://${bucketName}/${params.s3Key}`;
};

const createIdempotencyKey = (params: {
  tenant: string;
  eventType: string;
  businessEntityId: string;
  version?: string;
}) => `${params.tenant}:${params.eventType}:${params.businessEntityId}:${params.version || "v1"}`;

const buildDefaultPayload = (params: {
  videoId: string;
  jobId: string;
  prompt: string;
  videoS3Uri: string;
  outputS3Prefix: string;
  localJobDir: string;
  uploadBucket: string;
  overrides: CreateWorkerVideoAnalysisJobInput;
}): WorkerVideoAnalysisPayload => {
  const outputDir = params.overrides.render?.outputDir || `${params.localJobDir}/out`;
  const destinationPrefix =
    params.overrides.upload?.destinationPrefix || params.outputS3Prefix;

  return {
    ...(params.overrides.input || {}),
    videoId: params.videoId,
    jobId: params.jobId,
    prompt: params.prompt,
    videoS3Uri: params.videoS3Uri,
    outputS3Prefix: params.outputS3Prefix,
    localJobDir: params.localJobDir,
    render: {
      toolName:
        params.overrides.render?.toolName ||
        "video.worker.render_yolo_boxes_with_jersey_color",
      outputDir,
      yoloModel: params.overrides.render?.yoloModel || "yolov8n.pt",
      processFps: params.overrides.render?.processFps || 5,
      conf: params.overrides.render?.conf || 0.25,
    },
    stats: {
      toolName: params.overrides.stats?.toolName || "video.generate_stats_json",
      outputPath: params.overrides.stats?.outputPath || `${outputDir}/stats.json`,
    },
    upload: {
      toolName: params.overrides.upload?.toolName || "video.upload_artifacts_to_s3",
      bucket: params.overrides.upload?.bucket || params.uploadBucket,
      destinationPrefix,
    },
    analysis: {
      toolName:
        params.overrides.analysis?.toolName || "video.analyze_generated_artifacts",
      analysisPrompt:
        params.overrides.analysis?.analysisPrompt ||
        "Resume si los artefactos fueron generados correctamente y si hay hallazgos.",
    },
  };
};

export const buildWorkerInboundEvent = (params: {
  eventType: string;
  idempotencyKey: string;
  payload: Record<string, any>;
  requestId?: string;
  correlationId?: string;
  traceId?: string;
  maxAttempts?: number;
}): WorkerInboundEvent => ({
  contractVersion: "1.0",
  eventId: randomUUID(),
  eventType: params.eventType,
  occurredAt: new Date().toISOString(),
  tracing: {
    requestId: params.requestId || randomUUID(),
    correlationId: params.correlationId || randomUUID(),
    traceId: params.traceId || randomUUID(),
  },
  idempotencyKey: params.idempotencyKey,
  retry: {
    attempt: 0,
    maxAttempts: params.maxAttempts || 5,
  },
  payload: params.payload,
});

const mapWorkerResultToJobStatus = (status: WorkerResultStatus): "completed" | "failed" => {
  if (status === "FAILED") {
    return "failed";
  }

  return "completed";
};

const buildAgentNotificationMetadata = (params: {
  stage:
    | "queued"
    | "result_received"
    | "completed"
    | "partial_success"
    | "failed"
    | "enqueue_failed";
  eventType?: string;
  requestId?: string;
  correlationId?: string;
  traceId?: string;
  eventId?: string;
  idempotencyKey?: string;
  executionId?: string;
  resultId?: string;
  workerStatus?: WorkerResultStatus;
  summary?: string;
}) => ({
  flow: "agent",
  provider: "mcp_worker_agent",
  stage: params.stage,
  ...(params.eventType ? { eventType: params.eventType } : {}),
  ...(params.requestId ? { requestId: params.requestId } : {}),
  ...(params.correlationId ? { correlationId: params.correlationId } : {}),
  ...(params.traceId ? { traceId: params.traceId } : {}),
  ...(params.eventId ? { eventId: params.eventId } : {}),
  ...(params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : {}),
  ...(params.executionId ? { executionId: params.executionId } : {}),
  ...(params.resultId ? { resultId: params.resultId } : {}),
  ...(params.workerStatus ? { workerStatus: params.workerStatus } : {}),
  ...(params.summary ? { summary: params.summary } : {}),
});

const tryBuildArtifactFromCandidate = (params: {
  videoId: string;
  analysisJobId: string;
  candidate: Record<string, any>;
  fallbackToolName?: string;
  fallbackStepName?: string;
}) => {
  const candidate = params.candidate || {};
  const s3Uri =
    typeof candidate.s3Uri === "string"
      ? candidate.s3Uri
      : typeof candidate.uri === "string" && candidate.uri.startsWith("s3://")
        ? candidate.uri
        : undefined;
  const s3Key =
    typeof candidate.s3Key === "string"
      ? candidate.s3Key
      : typeof candidate.key === "string"
        ? candidate.key
        : s3Uri?.replace(/^s3:\/\/[^/]+\//, "");
  const s3Bucket =
    typeof candidate.s3Bucket === "string"
      ? candidate.s3Bucket
      : typeof candidate.bucket === "string"
        ? candidate.bucket
        : s3Uri?.replace(/^s3:\/\//, "").split("/")[0];

  if (!s3Key || !s3Bucket) {
    return null;
  }

  const inferredUri = s3Uri || `s3://${s3Bucket}/${s3Key}`;
  const fileName =
    typeof candidate.filename === "string" ? candidate.filename : s3Key.split("/").pop();
  const artifactType = (
    typeof candidate.artifactType === "string"
      ? candidate.artifactType
      : typeof candidate.type === "string"
        ? candidate.type
        : "other"
  ) as "json_result" | "json_stats" | "rendered_video" | "image" | "text_report" | "zip" | "other";
  const role = (
    typeof candidate.role === "string" ? candidate.role : "supporting_output"
  ) as "primary_output" | "supporting_output" | "debug" | "preview" | "final_report";

  return {
    videoId: params.videoId,
    analysisJobId: params.analysisJobId,
    flow: "agent" as const,
    producer: "mcp_worker_agent" as const,
    artifactType,
    role,
    promptKey: typeof candidate.promptKey === "string" ? candidate.promptKey : undefined,
    promptVersion: typeof candidate.promptVersion === "string" ? candidate.promptVersion : undefined,
    schemaName: typeof candidate.schemaName === "string" ? candidate.schemaName : undefined,
    schemaVersion: typeof candidate.schemaVersion === "string" ? candidate.schemaVersion : undefined,
    s3Bucket,
    s3Key,
    s3Uri: inferredUri,
    mimeType: typeof candidate.mimeType === "string" ? candidate.mimeType : undefined,
    fileSizeBytes: typeof candidate.fileSizeBytes === "number" ? candidate.fileSizeBytes : undefined,
    filename: fileName,
    title: typeof candidate.title === "string" ? candidate.title : undefined,
    description: typeof candidate.description === "string" ? candidate.description : undefined,
    stepName:
      typeof candidate.stepName === "string" ? candidate.stepName : params.fallbackStepName,
    toolName:
      typeof candidate.toolName === "string" ? candidate.toolName : params.fallbackToolName,
    status: (
      typeof candidate.status === "string" ? candidate.status : "uploaded"
    ) as "generated" | "uploaded" | "failed",
    isPrimary: Boolean(candidate.isPrimary),
    metadata:
      typeof candidate.metadata === "object" && candidate.metadata ? candidate.metadata : {},
    preview:
      typeof candidate.preview === "object" && candidate.preview ? candidate.preview : {},
  };
};

const extractArtifactsFromWorkerResult = (params: {
  videoId: string;
  analysisJobId: string;
  output: Record<string, any>;
}) => {
  const candidates: Array<Record<string, any>> = [];
  const directArtifacts = Array.isArray(params.output.artifacts) ? params.output.artifacts : [];

  for (const artifact of directArtifacts) {
    if (artifact && typeof artifact === "object") {
      candidates.push(artifact);
    }
  }

  const toolOutputs = Array.isArray(params.output.toolOutputs) ? params.output.toolOutputs : [];
  for (const toolOutput of toolOutputs) {
    if (!toolOutput || typeof toolOutput !== "object") {
      continue;
    }

    const nestedArtifacts = Array.isArray((toolOutput as any).artifacts)
      ? (toolOutput as any).artifacts
      : [];
    for (const artifact of nestedArtifacts) {
      if (artifact && typeof artifact === "object") {
        candidates.push({
          ...artifact,
          toolName:
            typeof (toolOutput as any).toolName === "string"
              ? (toolOutput as any).toolName
              : (artifact as any).toolName,
          stepName:
            typeof (toolOutput as any).stepName === "string"
              ? (toolOutput as any).stepName
              : (artifact as any).stepName,
        });
      }
    }

    candidates.push(toolOutput as Record<string, any>);
  }

  return candidates
    .map((candidate) =>
      tryBuildArtifactFromCandidate({
        videoId: params.videoId,
        analysisJobId: params.analysisJobId,
        candidate,
        fallbackToolName: typeof candidate.toolName === "string" ? candidate.toolName : undefined,
        fallbackStepName: typeof candidate.stepName === "string" ? candidate.stepName : undefined,
      }),
    )
    .filter(Boolean);
};

export const createWorkerVideoAnalysisJob = async (
  videoId: string,
  payload: CreateWorkerVideoAnalysisJobInput,
) => {
  toObjectId(videoId, "video_id");

  if (!payload.prompt || !payload.prompt.trim()) {
    throw new WorkerAgentServiceError(400, "invalid_prompt", "prompt is required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new WorkerAgentServiceError(404, "video_not_found", "Video not found");
  }

  const analysisType = payload.analysisType || "agent_prompt";
  const job = await AnalysisJob.create({
    videoId,
    analysisType,
    status: "queued",
    input: {
      prompt: payload.prompt,
      ...(payload.sportType ? { sportType: payload.sportType } : {}),
      ...(payload.input || {}),
    },
  });

  try {
    const outputS3Prefix = payload.outputS3Prefix || `video-analysis-results/${job._id}`;
    const localJobDir = payload.localJobDir || `/tmp/video-analysis/${job._id}`;
    const videoS3Uri = buildS3Uri({ s3Url: video.s3Url, s3Key: video.s3Key });
    const bucketName = process.env.BUCKET_NAME;

    if (!bucketName) {
      throw new WorkerAgentServiceError(500, "missing_bucket_name", "BUCKET_NAME is required");
    }

    const eventType = "video.analysis.requested";
    const workerEvent = buildWorkerInboundEvent({
      eventType,
      correlationId: payload.correlationId || String(job._id),
      traceId: payload.traceId,
      maxAttempts: payload.maxAttempts,
      idempotencyKey: createIdempotencyKey({
        tenant: "victorycraft",
        eventType,
        businessEntityId: videoId,
      }),
      payload: buildDefaultPayload({
        videoId,
        jobId: String(job._id),
        prompt: payload.prompt,
        videoS3Uri,
        outputS3Prefix,
        localJobDir,
        uploadBucket: bucketName,
        overrides: payload,
      }),
    });

    const response = await sendWorkerEvent(workerEvent);

    const updated = await AnalysisJob.findByIdAndUpdate(
      job._id,
      {
        sqsMessageId: response.messageId,
        workerEventId: workerEvent.eventId,
        workerRequestId: workerEvent.tracing.requestId,
        workerCorrelationId: workerEvent.tracing.correlationId,
        workerTraceId: workerEvent.tracing.traceId,
        workerIdempotencyKey: workerEvent.idempotencyKey,
      },
      { new: true },
    );

    try {
      await createNotification({
        type: "analysis_queued",
        message: `Analysis job queued for external worker. video=${videoId}`,
        videoId,
        analysisJobId: String(job._id),
        metadata: {
          analysisType,
          status: "queued",
          ...buildAgentNotificationMetadata({
            stage: "queued",
            eventType,
            requestId: workerEvent.tracing.requestId,
            correlationId: workerEvent.tracing.correlationId,
            traceId: workerEvent.tracing.traceId,
            eventId: workerEvent.eventId,
            idempotencyKey: workerEvent.idempotencyKey,
          }),
        },
      });
    } catch (notificationError: any) {
      console.error("Failed to create queue notification:", notificationError.message);
    }

    return {
      ...(updated?.toObject() || job.toObject()),
      workerEvent,
    };
  } catch (error: any) {
    const failed = await AnalysisJob.findByIdAndUpdate(
      job._id,
      { status: "failed", errorMessage: error.message },
      { new: true },
    );

    try {
      await createNotification({
        type: "analysis_failed",
        message: `Failed to enqueue worker analysis job for video ${videoId}`,
        videoId,
        analysisJobId: String(job._id),
        metadata: {
          reason: error.message,
          ...buildAgentNotificationMetadata({
            stage: "enqueue_failed",
          }),
        },
      });
    } catch (notificationError: any) {
      console.error("Failed to create enqueue error notification:", notificationError.message);
    }

    throw new WorkerAgentServiceError(
      500,
      "worker_enqueue_failed",
      failed?.errorMessage || "Failed to enqueue worker analysis job",
    );
  }
};

export const interpretWorkerResult = (message: unknown) => {
  const result = workerResultEventSchema.parse(message);
  return {
    result,
    requestId: result.output.requestId,
    correlationId: result.output.correlationId,
    executionId: result.executionId,
    status: result.status,
  };
};

export const applyWorkerResultToAnalysisJob = async (resultEvent: WorkerResultEvent) => {
  const parsed = workerResultEventSchema.parse(resultEvent);
  const requestId = parsed.output.requestId;
  const correlationId = parsed.output.correlationId;

  if (!requestId && !correlationId) {
    throw new WorkerAgentServiceError(
      400,
      "missing_result_correlation",
      "Worker result must include output.requestId or output.correlationId",
    );
  }

  const job = await AnalysisJob.findOne({
    $or: [
      ...(requestId ? [{ workerRequestId: requestId }] : []),
      ...(correlationId ? [{ workerCorrelationId: correlationId }] : []),
    ],
  });

  if (!job) {
    throw new WorkerAgentServiceError(
      404,
      "analysis_job_not_found",
      `No analysis job found for requestId=${requestId || "n/a"} correlationId=${correlationId || "n/a"}`,
    );
  }

  const newStatus = mapWorkerResultToJobStatus(parsed.status);

  try {
    await createNotification({
      type: "info",
      message: `Worker result received for analysis job ${String(job._id)}`,
      videoId: String(job.videoId),
      analysisJobId: String(job._id),
      metadata: buildAgentNotificationMetadata({
        stage: "result_received",
        requestId,
        correlationId,
        executionId: parsed.executionId,
        resultId: parsed.resultId,
        workerStatus: parsed.status,
        summary: parsed.summary,
      }),
    });
  } catch (notificationError: any) {
    console.error("Failed to create worker result received notification:", notificationError.message);
  }

  const updated = await AnalysisJob.findByIdAndUpdate(
    job._id,
    {
      status: newStatus,
      output: parsed.output,
      errorMessage: parsed.status === "FAILED" ? parsed.summary : undefined,
      completedAt: new Date(),
      workerExecutionId: parsed.executionId,
      workerResultId: parsed.resultId,
      workerResultStatus: parsed.status,
    },
    { new: true },
  );

  try {
    const artifacts = extractArtifactsFromWorkerResult({
      videoId: String(job.videoId),
      analysisJobId: String(job._id),
      output: (parsed.output || {}) as Record<string, any>,
    });

    await createVideoAnalysisRecord({
      videoId: String(job.videoId),
      analysisJobId: String(job._id),
      analysisType: job.analysisType,
      input: job.input || {},
      output: parsed.output || {},
      extraParams: {
        source: "mcp_worker_agent",
        summary: parsed.summary,
        executionId: parsed.executionId,
        resultId: parsed.resultId,
        requestId,
        correlationId,
      },
      artifactSummary: {
        count: artifacts.length,
        primaryArtifactS3Key: artifacts.find((artifact) => artifact.isPrimary)?.s3Key,
      },
    });

    if (artifacts.length) {
      await upsertAnalysisArtifacts(artifacts);
    }
  } catch (recordError: any) {
    console.error("Failed to persist analysis record or artifacts:", recordError.message);
  }

  try {
    await createNotification({
      type: parsed.status === "FAILED" ? "analysis_failed" : "analysis_completed",
      message: parsed.summary,
      videoId: String(job.videoId),
      analysisJobId: String(job._id),
      metadata: {
        status: parsed.status,
        ...buildAgentNotificationMetadata({
          stage: parsed.status === "FAILED" ? "failed" : parsed.status === "PARTIAL_SUCCESS" ? "partial_success" : "completed",
          requestId,
          correlationId,
          executionId: parsed.executionId,
          resultId: parsed.resultId,
          workerStatus: parsed.status,
          summary: parsed.summary,
        }),
      },
    });
  } catch (notificationError: any) {
    console.error("Failed to create worker result notification:", notificationError.message);
  }

  return updated?.toObject() || updated;
};
