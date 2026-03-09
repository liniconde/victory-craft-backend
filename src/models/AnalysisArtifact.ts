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
  artifactType: AnalysisArtifactType;
  role: AnalysisArtifactRole;
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
  status: AnalysisArtifactStatus;
  isPrimary?: boolean;
  metadata?: Record<string, any>;
  preview?: Record<string, any>;
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
    schemaName: { type: String, required: false },
    schemaVersion: { type: String, required: false },
    s3Bucket: { type: String, required: true },
    s3Key: { type: String, required: true },
    s3Uri: { type: String, required: true },
    mimeType: { type: String, required: false },
    fileSizeBytes: { type: Number, required: false },
    filename: { type: String, required: false },
    title: { type: String, required: false },
    description: { type: String, required: false },
    stepName: { type: String, required: false },
    toolName: { type: String, required: false },
    status: {
      type: String,
      enum: ["generated", "uploaded", "failed"],
      required: true,
      default: "uploaded",
    },
    isPrimary: { type: Boolean, required: false, default: false },
    metadata: { type: Schema.Types.Mixed, required: false },
    preview: { type: Schema.Types.Mixed, required: false },
  },
  { timestamps: true },
);

AnalysisArtifactSchema.index({ analysisJobId: 1, s3Key: 1 }, { unique: true });

export default mongoose.model<IAnalysisArtifact>("AnalysisArtifact", AnalysisArtifactSchema);
