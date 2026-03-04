import mongoose, { Document, Schema } from "mongoose";

interface IMatchSession extends Document {
  ownerId: mongoose.Types.ObjectId;
  title: string;
  status: "active" | "ended";
  endedAt?: Date;
  totalDurationSec: number;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSessionSchema = new Schema<IMatchSession>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    status: { type: String, enum: ["active", "ended"], required: true, default: "active" },
    endedAt: { type: Date, required: false },
    totalDurationSec: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model<IMatchSession>("MatchSession", MatchSessionSchema);
