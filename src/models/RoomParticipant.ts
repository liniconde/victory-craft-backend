import mongoose, { Document, Schema } from "mongoose";

interface IRoomParticipant extends Document {
  roomId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: "owner" | "participant";
  joinedAt: Date;
  leftAt?: Date;
  status: "active" | "left";
  createdAt: Date;
  updatedAt: Date;
}

const RoomParticipantSchema = new Schema<IRoomParticipant>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "StreamRoom", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["owner", "participant"], required: true, default: "participant" },
    joinedAt: { type: Date, required: true, default: Date.now },
    leftAt: { type: Date, required: false },
    status: { type: String, enum: ["active", "left"], required: true, default: "active" },
  },
  { timestamps: true },
);

RoomParticipantSchema.index({ roomId: 1, userId: 1, status: 1 });

export default mongoose.model<IRoomParticipant>("RoomParticipant", RoomParticipantSchema);
