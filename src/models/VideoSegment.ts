import mongoose, { Document, Schema } from "mongoose";

interface IVideoSegment extends Document {
  matchSessionId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  libraryVideoId?: mongoose.Types.ObjectId;
  sequence: number;
  durationSec: number;
  startOffsetSec: number;
  endOffsetSec: number;
  s3Key: string;
  videoUrl: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSegmentSchema = new Schema<IVideoSegment>(
  {
    matchSessionId: {
      type: Schema.Types.ObjectId,
      ref: "MatchSession",
      required: true,
      index: true,
    },
    roomId: { type: Schema.Types.ObjectId, ref: "StreamRoom", required: true, index: true },
    libraryVideoId: { type: Schema.Types.ObjectId, ref: "Video", required: false },
    sequence: { type: Number, required: true },
    durationSec: { type: Number, required: true, min: 0 },
    startOffsetSec: { type: Number, required: true, min: 0 },
    endOffsetSec: { type: Number, required: true, min: 0 },
    s3Key: { type: String, required: true },
    videoUrl: { type: String, required: true },
    uploadedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

VideoSegmentSchema.index({ matchSessionId: 1, sequence: 1 }, { unique: true });

export default mongoose.model<IVideoSegment>("VideoSegment", VideoSegmentSchema);
