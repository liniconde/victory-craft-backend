import mongoose, { Document, Schema } from "mongoose";

export type AnalysisJobStatus =
  | "queued"
  | "started"
  | "in_progress"
  | "completed"
  | "failed";

export type AnalysisJobType = "agent_prompt" | "custom";

interface IAnalysisJob extends Document {
  videoId: mongoose.Types.ObjectId;
  analysisType: AnalysisJobType;
  status: AnalysisJobStatus;
  input: Record<string, any>;
  output?: Record<string, any>;
  errorMessage?: string;
  sqsMessageId?: string;
  workerEventId?: string;
  workerRequestId?: string;
  workerCorrelationId?: string;
  workerTraceId?: string;
  workerIdempotencyKey?: string;
  workerExecutionId?: string;
  workerResultId?: string;
  workerResultStatus?: "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED";
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisJobSchema = new Schema<IAnalysisJob>(
  {
    videoId: { type: Schema.Types.ObjectId, ref: "Video", required: true, index: true },
    analysisType: {
      type: String,
      enum: ["agent_prompt", "custom"],
      required: true,
      default: "agent_prompt",
    },
    status: {
      type: String,
      enum: ["queued", "started", "in_progress", "completed", "failed"],
      required: true,
      default: "queued",
      index: true,
    },
    input: { type: Schema.Types.Mixed, required: true, default: {} },
    output: { type: Schema.Types.Mixed, required: false },
    errorMessage: { type: String, required: false },
    sqsMessageId: { type: String, required: false },
    workerEventId: { type: String, required: false, index: true },
    workerRequestId: { type: String, required: false, index: true },
    workerCorrelationId: { type: String, required: false, index: true },
    workerTraceId: { type: String, required: false },
    workerIdempotencyKey: { type: String, required: false, index: true },
    workerExecutionId: { type: String, required: false, index: true },
    workerResultId: { type: String, required: false },
    workerResultStatus: {
      type: String,
      enum: ["SUCCESS", "PARTIAL_SUCCESS", "FAILED"],
      required: false,
    },
    startedAt: { type: Date, required: false },
    completedAt: { type: Date, required: false },
  },
  { timestamps: true },
);

export default mongoose.model<IAnalysisJob>("AnalysisJob", AnalysisJobSchema);
