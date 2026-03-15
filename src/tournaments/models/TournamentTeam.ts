import mongoose, { Document, Schema } from "mongoose";

export interface ITournamentTeam extends Document {
  tournamentId: mongoose.Types.ObjectId;
  name: string;
  shortName?: string;
  logoUrl?: string;
  coachName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TournamentTeamSchema = new Schema<ITournamentTeam>(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    shortName: { type: String, required: false, trim: true },
    logoUrl: { type: String, required: false, trim: true },
    coachName: { type: String, required: false, trim: true },
  },
  { timestamps: true },
);

TournamentTeamSchema.index({ tournamentId: 1, name: 1 }, { unique: true });

export default mongoose.model<ITournamentTeam>("TournamentTeam", TournamentTeamSchema);
