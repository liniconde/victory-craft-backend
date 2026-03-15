import mongoose, { Document, Schema } from "mongoose";
import { TournamentStatus } from "../contracts/tournamentContracts";

export interface ITournament extends Document {
  name: string;
  sport: string;
  description?: string;
  ownerId?: mongoose.Types.ObjectId;
  status: TournamentStatus;
  startsAt?: Date;
  endsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TournamentSchema = new Schema<ITournament>(
  {
    name: { type: String, required: true, trim: true },
    sport: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, required: false, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: false, index: true },
    status: {
      type: String,
      enum: ["draft", "registration_open", "in_progress", "completed", "cancelled"],
      default: "draft",
      required: true,
      index: true,
    },
    startsAt: { type: Date, required: false },
    endsAt: { type: Date, required: false },
  },
  { timestamps: true },
);

export default mongoose.model<ITournament>("Tournament", TournamentSchema);
