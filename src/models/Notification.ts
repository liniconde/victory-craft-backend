import mongoose, { Document, Schema } from "mongoose";

type NotificationType = "analysis_queued" | "analysis_completed" | "analysis_failed" | "info";

interface INotification extends Document {
  type: NotificationType;
  message: string;
  videoId?: mongoose.Types.ObjectId;
  analysisJobId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: ["analysis_queued", "analysis_completed", "analysis_failed", "info"],
      required: true,
      default: "info",
    },
    message: { type: String, required: true },
    videoId: { type: Schema.Types.ObjectId, ref: "Video", required: false, index: true },
    analysisJobId: {
      type: Schema.Types.ObjectId,
      ref: "AnalysisJob",
      required: false,
      index: true,
    },
    metadata: { type: Schema.Types.Mixed, required: false },
  },
  { timestamps: true },
);

export default mongoose.model<INotification>("Notification", NotificationSchema);
