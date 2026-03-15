import mongoose, { Document, Schema } from "mongoose";
import { MatchStatus } from "../contracts/tournamentContracts";

export interface ITournamentMatch extends Document {
  homeTeamId: mongoose.Types.ObjectId;
  awayTeamId: mongoose.Types.ObjectId;
  pairKey: string;
  scheduledAt?: Date;
  venue?: string;
  round?: string;
  status: MatchStatus;
  score?: {
    home: number;
    away: number;
  };
  winnerTeamId?: mongoose.Types.ObjectId;
  matchSessionId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TournamentMatchSchema = new Schema<ITournamentMatch>(
  {
    homeTeamId: {
      type: Schema.Types.ObjectId,
      ref: "TournamentTeam",
      required: true,
      index: true,
    },
    awayTeamId: {
      type: Schema.Types.ObjectId,
      ref: "TournamentTeam",
      required: true,
      index: true,
    },
    pairKey: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: false, index: true },
    venue: { type: String, required: false, trim: true },
    round: { type: String, required: false, trim: true },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "finished", "cancelled"],
      default: "scheduled",
      required: true,
      index: true,
    },
    score: {
      home: { type: Number, required: true, default: 0, min: 0 },
      away: { type: Number, required: true, default: 0, min: 0 },
    },
    winnerTeamId: { type: Schema.Types.ObjectId, ref: "TournamentTeam", required: false },
    matchSessionId: { type: Schema.Types.ObjectId, ref: "MatchSession", required: false, index: true },
  },
  { timestamps: true },
);

TournamentMatchSchema.index({ pairKey: 1 }, { unique: true });
export default mongoose.model<ITournamentMatch>("TournamentMatch", TournamentMatchSchema);
