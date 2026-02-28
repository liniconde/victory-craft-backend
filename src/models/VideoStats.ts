import mongoose, { Schema, Document } from "mongoose";

interface TeamStats {
  teamKey?: "A" | "B";
  teamName: string;
  stats: Record<string, number>;
}

interface MatchMetric {
  total: number;
  teamA: number;
  teamB: number;
}

interface ManualEvent {
  id: string;
  time: number;
  type: "pass" | "shot" | "goal" | "foul" | "other";
  team: "A" | "B";
  note?: string;
}

interface IVideoStats extends Document {
  videoId: mongoose.Types.ObjectId;
  sportType: "football" | "padel" | "tennis" | "basketball" | "other";
  teamAName?: string;
  teamBName?: string;
  teams: TeamStats[];
  matchStats?: {
    passes: MatchMetric;
    shots: MatchMetric;
    goals: MatchMetric;
    fouls: MatchMetric;
    others: MatchMetric;
  };
  events?: ManualEvent[];
  summary?: string;
  generatedByModel:
    | "manual"
    | "OpenPose"
    | "YOLOv8"
    | "DeepSportAnalyzer"
    | "BallTrackNet"
    | "Gemini-2.0-Flash"
    | "custom";
  createdAt: Date;
  updatedAt: Date;
}

const MatchMetricSchema = new Schema<MatchMetric>(
  {
    total: { type: Number, default: 0, required: true },
    teamA: { type: Number, default: 0, required: true },
    teamB: { type: Number, default: 0, required: true },
  },
  { _id: false },
);

const ManualEventSchema = new Schema<ManualEvent>(
  {
    id: { type: String, required: true },
    time: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: ["pass", "shot", "goal", "foul", "other"],
      required: true,
    },
    team: { type: String, enum: ["A", "B"], required: true },
    note: { type: String, maxlength: 500 },
  },
  { _id: false },
);

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
      enum: ["football", "padel", "tennis", "basketball", "other"],
      required: true,
    },
    teamAName: { type: String, required: false },
    teamBName: { type: String, required: false },
    teams: [
      {
        teamKey: { type: String, enum: ["A", "B"], required: false },
        teamName: { type: String, required: true },
        stats: { type: Object, default: {} },
      },
    ],
    matchStats: {
      passes: { type: MatchMetricSchema, required: false },
      shots: { type: MatchMetricSchema, required: false },
      goals: { type: MatchMetricSchema, required: false },
      fouls: { type: MatchMetricSchema, required: false },
      others: { type: MatchMetricSchema, required: false },
    },
    events: {
      type: [ManualEventSchema],
      required: false,
      default: undefined,
    },
    summary: { type: String, default: "" },
    generatedByModel: {
      type: String,
      enum: [
        "manual",
        "OpenPose",
        "YOLOv8",
        "DeepSportAnalyzer",
        "BallTrackNet",
        "Gemini-2.0-Flash",
        "custom",
      ],
      required: true,
      default: "manual",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IVideoStats>("VideoStats", VideoStatsSchema);
