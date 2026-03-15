import mongoose, { Document, Schema } from "mongoose";

export interface ITournamentPlayer extends Document {
  teamId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  position?: string;
  birthDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TournamentPlayerSchema = new Schema<ITournamentPlayer>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "TournamentTeam",
      required: true,
      index: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    jerseyNumber: { type: Number, required: false, min: 0 },
    position: { type: String, required: false, trim: true },
    birthDate: { type: Date, required: false },
  },
  { timestamps: true },
);

TournamentPlayerSchema.index({ teamId: 1, jerseyNumber: 1 }, { unique: true, sparse: true });

export default mongoose.model<ITournamentPlayer>("TournamentPlayer", TournamentPlayerSchema);
