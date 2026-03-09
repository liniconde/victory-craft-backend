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
  artifactType: AnalysisArtifactType;
  role?: AnalysisArtifactRole;
  promptKey?: string;
  promptVersion?: string;
  schemaName?: string;
  schemaVersion?: string;
  s3Bucket: string;
  s3Key: string;
  s3Uri: string;
  mimeType?: string;
  fileSizeBytes?: number;
  filename?: string;
  title?: string;
  description?: string;
  stepName?: string;
  toolName?: string;
  status?: AnalysisArtifactStatus;
  isPrimary?: boolean;
  metadata?: Record<string, any>;
  preview?: Record<string, any>;
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

const normalizeArtifact = (artifact: AnalysisArtifactInput) => ({
  videoId: artifact.videoId,
  analysisJobId: artifact.analysisJobId,
  flow: artifact.flow,
  producer: artifact.producer,
  artifactType: artifact.artifactType,
  role: artifact.role || "supporting_output",
  promptKey: artifact.promptKey,
  promptVersion: artifact.promptVersion,
  schemaName: artifact.schemaName,
  schemaVersion: artifact.schemaVersion,
  s3Bucket: artifact.s3Bucket,
  s3Key: artifact.s3Key,
  s3Uri: artifact.s3Uri,
  mimeType: artifact.mimeType,
  fileSizeBytes: artifact.fileSizeBytes,
  filename: artifact.filename,
  title: artifact.title,
  description: artifact.description,
  stepName: artifact.stepName,
  toolName: artifact.toolName,
  status: artifact.status || "uploaded",
  isPrimary: artifact.isPrimary || false,
  metadata: artifact.metadata || {},
  preview: artifact.preview || {},
});

export const upsertAnalysisArtifacts = async (artifacts: AnalysisArtifactInput[]) => {
  if (!artifacts.length) {
    return [];
  }

  const operations = artifacts.map((artifact) => ({
    updateOne: {
      filter: {
        analysisJobId: artifact.analysisJobId,
        s3Key: artifact.s3Key,
      },
      update: {
        $set: normalizeArtifact(artifact),
      },
      upsert: true,
    },
  }));

  await AnalysisArtifact.bulkWrite(operations);

  const keys = artifacts.map((artifact) => artifact.s3Key);
  const docs = await AnalysisArtifact.find({
    analysisJobId: artifacts[0].analysisJobId,
    s3Key: { $in: keys },
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
    AnalysisArtifact.find({ videoId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AnalysisArtifact.countDocuments({ videoId }),
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
    AnalysisArtifact.find({ analysisJobId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AnalysisArtifact.countDocuments({ analysisJobId }),
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
