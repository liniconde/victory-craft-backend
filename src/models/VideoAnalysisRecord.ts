import mongoose, { Document, Schema } from "mongoose";

interface IVideoAnalysisRecord extends Document {
  videoId: mongoose.Types.ObjectId;
  analysisJobId: mongoose.Types.ObjectId;
  analysisType: "agent_prompt" | "custom";
  input: Record<string, any>;
  output: Record<string, any>;
  params?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const VideoAnalysisRecordSchema = new Schema<IVideoAnalysisRecord>(
  {
    videoId: { type: Schema.Types.ObjectId, ref: "Video", required: true, index: true },
    analysisJobId: {
      type: Schema.Types.ObjectId,
      ref: "AnalysisJob",
      required: true,
      index: true,
      unique: true,
    },
    analysisType: {
      type: String,
      enum: ["agent_prompt", "custom"],
      required: true,
      default: "agent_prompt",
    },
    input: { type: Schema.Types.Mixed, required: true, default: {} },
    output: { type: Schema.Types.Mixed, required: true, default: {} },
    params: { type: Schema.Types.Mixed, required: false },
  },
  { timestamps: true },
);

export default mongoose.model<IVideoAnalysisRecord>(
  "VideoAnalysisRecord",
  VideoAnalysisRecordSchema,
);
