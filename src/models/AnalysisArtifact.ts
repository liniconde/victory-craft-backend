import mongoose, { Document, Schema } from "mongoose";

export type AnalysisArtifactFlow = "gemini" | "agent";
export type AnalysisArtifactProducer = "gemini" | "mcp_worker_agent" | "unknown";
export type AnalysisArtifactType =
  | "json_result"
  | "json_stats"
  | "rendered_video"
  | "image"
  | "text_report"
  | "zip"
  | "other";
export type AnalysisArtifactRole =
  | "primary_output"
  | "supporting_output"
  | "debug"
  | "preview"
  | "final_report";
export type AnalysisArtifactStatus = "generated" | "uploaded" | "failed";

interface IAnalysisArtifact extends Document {
  videoId: mongoose.Types.ObjectId;
  analysisJobId: mongoose.Types.ObjectId;
  flow: AnalysisArtifactFlow;
  producer: AnalysisArtifactProducer;
  executionId: string;
  resultId: string;
  artifactId: string;
  artifactType: AnalysisArtifactType;
  role: AnalysisArtifactRole;
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
  producedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisArtifactSchema = new Schema<IAnalysisArtifact>(
  {
    videoId: { type: Schema.Types.ObjectId, ref: "Video", required: true, index: true },
    analysisJobId: {
      type: Schema.Types.ObjectId,
      ref: "AnalysisJob",
      required: true,
      index: true,
    },
    flow: {
      type: String,
      enum: ["gemini", "agent"],
      required: true,
      default: "agent",
    },
    producer: {
      type: String,
      enum: ["gemini", "mcp_worker_agent", "unknown"],
      required: true,
      default: "unknown",
    },
    executionId: { type: String, required: true, index: true },
    resultId: { type: String, required: true, index: true },
    artifactId: { type: String, required: true },
    artifactType: {
      type: String,
      enum: ["json_result", "json_stats", "rendered_video", "image", "text_report", "zip", "other"],
      required: true,
      default: "other",
    },
    role: {
      type: String,
      enum: ["primary_output", "supporting_output", "debug", "preview", "final_report"],
      required: true,
      default: "supporting_output",
    },
    promptKey: { type: String, required: false },
    promptVersion: { type: String, required: false },
    storage: {
      provider: { type: String, enum: ["s3"], required: true, default: "s3" },
      status: {
        type: String,
        enum: ["generated", "uploaded", "failed"],
        required: true,
        default: "uploaded",
      },
      s3Bucket: { type: String, required: false },
      s3Key: { type: String, required: false },
      s3Uri: { type: String, required: false },
    },
    mimeType: { type: String, required: false },
    fileSizeBytes: { type: Number, required: false },
    filename: { type: String, required: true },
    title: { type: String, required: false },
    description: { type: String, required: false },
    stepName: { type: String, required: true },
    toolName: { type: String, required: true },
    isPrimary: { type: Boolean, required: true, default: false },
    schemaName: { type: String, required: false },
    schemaVersion: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, required: false },
    preview: { type: Schema.Types.Mixed, required: false },
    requestId: { type: String, required: true, index: true },
    correlationId: { type: String, required: true, index: true },
    resultStatus: {
      type: String,
      enum: ["SUCCESS", "PARTIAL_SUCCESS", "FAILED"],
      required: true,
      index: true,
    },
    summary: { type: String, required: true },
    producedAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

AnalysisArtifactSchema.index({ executionId: 1, artifactId: 1 }, { unique: true });

export default mongoose.model<IAnalysisArtifact>("AnalysisArtifact", AnalysisArtifactSchema);
