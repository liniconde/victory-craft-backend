import mongoose, { Document, Schema } from "mongoose";

export interface ITournamentMatchStat extends Document {
  matchId: mongoose.Types.ObjectId;
  sport?: string;
  stats: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const TournamentMatchStatSchema = new Schema<ITournamentMatchStat>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "TournamentMatch",
      required: true,
      index: true,
    },
    sport: { type: String, required: false, trim: true, lowercase: true },
    stats: { type: Schema.Types.Mixed, required: true, default: {} },
  },
  { timestamps: true },
);

TournamentMatchStatSchema.index({ matchId: 1, createdAt: -1 });

export default mongoose.model<ITournamentMatchStat>("TournamentMatchStat", TournamentMatchStatSchema);
