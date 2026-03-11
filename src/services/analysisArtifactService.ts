import mongoose from "mongoose";
import AnalysisArtifact, {
  AnalysisArtifactFlow,
  AnalysisArtifactProducer,
  AnalysisArtifactRole,
  AnalysisArtifactStatus,
  AnalysisArtifactType,
} from "../models/AnalysisArtifact";

type AnalysisArtifactInput = {
  videoId: string;
  analysisJobId: string;
  flow: AnalysisArtifactFlow;
  producer: AnalysisArtifactProducer;
  executionId: string;
  resultId: string;
  artifactId: string;
  artifactType: AnalysisArtifactType;
  role?: AnalysisArtifactRole;
  promptKey?: string;
  promptVersion?: string;
  storage: {
    provider: "s3";
    status: AnalysisArtifactStatus;
    s3Bucket?: string;
    s3Key?: string;
    s3Uri?: string;
  };
  mimeType?: string;
  fileSizeBytes?: number;
  filename: string;
  title?: string;
  description?: string;
  stepName: string;
  toolName: string;
  isPrimary: boolean;
  schemaName?: string;
  schemaVersion: string;
  metadata?: Record<string, any>;
  preview?: Record<string, any>;
  requestId: string;
  correlationId: string;
  resultStatus: "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED";
  summary: string;
  producedAt: string;
};

export class AnalysisArtifactServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const assertObjectId = (value: string, code: string, message: string) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    throw new AnalysisArtifactServiceError(400, code, message);
  }
};

const toObjectId = (value: string) => new mongoose.Types.ObjectId(value);

const buildCompatibleIdQuery = (value: string) => ({
  $in: [value, toObjectId(value)],
});

const normalizeArtifact = (artifact: AnalysisArtifactInput) => ({
  videoId: toObjectId(artifact.videoId),
  analysisJobId: toObjectId(artifact.analysisJobId),
  flow: artifact.flow,
  producer: artifact.producer,
  executionId: artifact.executionId,
  resultId: artifact.resultId,
  artifactId: artifact.artifactId,
  artifactType: artifact.artifactType,
  role: artifact.role || "supporting_output",
  promptKey: artifact.promptKey,
  promptVersion: artifact.promptVersion,
  storage: artifact.storage,
  mimeType: artifact.mimeType,
  fileSizeBytes: artifact.fileSizeBytes,
  filename: artifact.filename,
  title: artifact.title,
  description: artifact.description,
  stepName: artifact.stepName,
  toolName: artifact.toolName,
  isPrimary: artifact.isPrimary,
  schemaName: artifact.schemaName,
  schemaVersion: artifact.schemaVersion,
  metadata: artifact.metadata || {},
  preview: artifact.preview || {},
  requestId: artifact.requestId,
  correlationId: artifact.correlationId,
  resultStatus: artifact.resultStatus,
  summary: artifact.summary,
  producedAt: new Date(artifact.producedAt),
});

export const upsertAnalysisArtifacts = async (artifacts: AnalysisArtifactInput[]) => {
  if (!artifacts.length) {
    return [];
  }

  const operations = artifacts.map((artifact) => ({
    updateOne: {
      filter: {
        executionId: artifact.executionId,
        artifactId: artifact.artifactId,
      },
      update: {
        $set: normalizeArtifact(artifact),
      },
      upsert: true,
    },
  }));

  await AnalysisArtifact.bulkWrite(operations);

  const artifactIds = artifacts.map((artifact) => artifact.artifactId);
  const docs = await AnalysisArtifact.find({
    executionId: artifacts[0].executionId,
    artifactId: { $in: artifactIds },
  }).sort({ createdAt: 1 });

  return docs.map((doc) => (doc.toObject ? doc.toObject() : doc));
};

export const listAnalysisArtifactsByVideoId = async (
  videoId: string,
  options?: { page?: number; limit?: number },
) => {
  assertObjectId(videoId, "invalid_video_id", "Invalid video id");

  const page = Math.max(1, options?.page || 1);
  const limit = Math.min(100, Math.max(1, options?.limit || 20));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    AnalysisArtifact.find({ videoId: buildCompatibleIdQuery(videoId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AnalysisArtifact.countDocuments({ videoId: buildCompatibleIdQuery(videoId) }),
  ]);

  return {
    items: items.map((item) => (item.toObject ? item.toObject() : item)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

export const listAnalysisArtifactsByJobId = async (
  analysisJobId: string,
  options?: { page?: number; limit?: number },
) => {
  assertObjectId(analysisJobId, "invalid_job_id", "Invalid analysis job id");

  const page = Math.max(1, options?.page || 1);
  const limit = Math.min(100, Math.max(1, options?.limit || 20));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    AnalysisArtifact.find({ analysisJobId: buildCompatibleIdQuery(analysisJobId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AnalysisArtifact.countDocuments({ analysisJobId: buildCompatibleIdQuery(analysisJobId) }),
  ]);

  return {
    items: items.map((item) => (item.toObject ? item.toObject() : item)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};
