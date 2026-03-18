import mongoose, { Document, Schema } from "mongoose";

export interface IVideoVote extends Document {
  videoId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  value: -1 | 1;
  createdAt: Date;
  updatedAt: Date;
}

const VideoVoteSchema = new Schema<IVideoVote>(
  {
    videoId: { type: Schema.Types.ObjectId, ref: "Video", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    value: { type: Number, enum: [-1, 1], required: true },
  },
  { timestamps: true },
);

VideoVoteSchema.index({ videoId: 1, userId: 1 }, { unique: true, name: "uq_video_user_vote" });
VideoVoteSchema.index({ videoId: 1, value: 1 });
VideoVoteSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IVideoVote>("VideoVote", VideoVoteSchema, "video_votes");
