import mongoose, { Document, Schema } from "mongoose";

interface IGeminiTokenUsage extends Document {
  modelName: string;
  source?: string;
  usageMetadata: Record<string, any>;
  totalTokenCount?: number | null;
  promptTokenCount?: number | null;
  candidatesTokenCount?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const GeminiTokenUsageSchema = new Schema<IGeminiTokenUsage>(
  {
    modelName: { type: String, required: true },
    source: { type: String, required: false },
    usageMetadata: { type: Schema.Types.Mixed, required: true, default: {} },
    totalTokenCount: { type: Number, required: false, default: null },
    promptTokenCount: { type: Number, required: false, default: null },
    candidatesTokenCount: { type: Number, required: false, default: null },
  },
  { timestamps: true },
);

GeminiTokenUsageSchema.index({ createdAt: -1 });
GeminiTokenUsageSchema.index({ modelName: 1, createdAt: -1 });

export default mongoose.model<IGeminiTokenUsage>("GeminiTokenUsage", GeminiTokenUsageSchema);
