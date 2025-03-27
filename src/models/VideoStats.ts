import mongoose, { Schema, Document } from "mongoose";

interface TeamStats {
  teamName: string;
  stats: Record<string, number>;
}

interface IVideoStats extends Document {
  videoId: mongoose.Types.ObjectId;
  sportType: "football" | "padel" | "tennis";
  teams: TeamStats[];
  generatedByModel:
    | "manual"
    | "OpenPose"
    | "YOLOv8"
    | "DeepSportAnalyzer"
    | "BallTrackNet";
  createdAt: Date;
  updatedAt: Date;
}

const VideoStatsSchema = new Schema<IVideoStats>(
  {
    videoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      unique: true,
    },
    sportType: {
      type: String,
      enum: ["football", "padel", "tennis"],
      required: true,
    },
    teams: [
      {
        teamName: { type: String, required: true },
        stats: { type: Map, of: Number, default: {} },
      },
    ],
    generatedByModel: {
      type: String,
      enum: [
        "manual",
        "OpenPose",
        "YOLOv8",
        "DeepSportAnalyzer",
        "BallTrackNet",
      ],
      required: true,
      default: "manual",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IVideoStats>("VideoStats", VideoStatsSchema);
