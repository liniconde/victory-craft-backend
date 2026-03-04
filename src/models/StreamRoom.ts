import mongoose, { Document, Schema } from "mongoose";

interface IStreamRoom extends Document {
  matchSessionId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  status: "active" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const StreamRoomSchema = new Schema<IStreamRoom>(
  {
    matchSessionId: {
      type: Schema.Types.ObjectId,
      ref: "MatchSession",
      required: true,
      index: true,
    },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["active", "closed"], required: true, default: "active" },
  },
  { timestamps: true },
);

export default mongoose.model<IStreamRoom>("StreamRoom", StreamRoomSchema);
