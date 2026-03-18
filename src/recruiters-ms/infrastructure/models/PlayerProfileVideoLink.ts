import mongoose, { Document, Schema } from "mongoose";

export interface IPlayerProfileVideoLink extends Document {
  playerProfileId: mongoose.Types.ObjectId;
  videoId: mongoose.Types.ObjectId;
  linkedBy?: mongoose.Types.ObjectId;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PlayerProfileVideoLinkSchema = new Schema<IPlayerProfileVideoLink>(
  {
    playerProfileId: { type: Schema.Types.ObjectId, ref: "PlayerProfile", required: true, index: true },
    videoId: { type: Schema.Types.ObjectId, ref: "Video", required: true, unique: true, index: true },
    linkedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
    notes: { type: String, trim: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

PlayerProfileVideoLinkSchema.index({ playerProfileId: 1, createdAt: -1 });

export default mongoose.model<IPlayerProfileVideoLink>(
  "PlayerProfileVideoLink",
  PlayerProfileVideoLinkSchema,
  "player_profile_video_links",
);
