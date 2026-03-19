import mongoose, { Document, Schema } from "mongoose";
import { normalizeSportType, SPORT_TYPES, SportType } from "../../../shared/sportTypes";

export interface IVideoScoutingProfile extends Document {
  videoId: mongoose.Types.ObjectId;
  playerProfileId?: mongoose.Types.ObjectId;
  publicationStatus: "draft" | "published" | "archived";
  title?: string;
  sportType?: SportType;
  playType?: string;
  tournamentType?: string;
  playerName?: string;
  playerAge?: number;
  playerPosition?: string;
  playerTeam?: string;
  playerCategory?: string;
  jerseyNumber?: number;
  dominantProfile?: string;
  country?: string;
  city?: string;
  tournamentName?: string;
  notes?: string;
  tags: string[];
  recordedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VideoScoutingProfileSchema = new Schema<IVideoScoutingProfile>(
  {
    videoId: { type: Schema.Types.ObjectId, ref: "Video", required: true, unique: true, index: true },
    playerProfileId: { type: Schema.Types.ObjectId, ref: "PlayerProfile", required: false, index: true },
    publicationStatus: {
      type: String,
      enum: ["draft", "published", "archived"],
      required: true,
      default: "published",
      index: true,
    },
    title: { type: String, trim: true },
    sportType: { type: String, trim: true, enum: SPORT_TYPES, set: normalizeSportType, index: true },
    playType: { type: String, trim: true, index: true },
    tournamentType: { type: String, trim: true, index: true },
    playerName: { type: String, trim: true, index: true },
    playerAge: { type: Number, min: 0, max: 100 },
    playerPosition: { type: String, trim: true, index: true },
    playerTeam: { type: String, trim: true, index: true },
    playerCategory: { type: String, trim: true, index: true },
    jerseyNumber: { type: Number, min: 0, max: 99 },
    dominantProfile: { type: String, trim: true, index: true },
    country: { type: String, trim: true, index: true },
    city: { type: String, trim: true, index: true },
    tournamentName: { type: String, trim: true, index: true },
    notes: { type: String, trim: true },
    tags: { type: [String], default: [], index: true },
    recordedAt: { type: Date, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  },
  { timestamps: true },
);

VideoScoutingProfileSchema.index({ sportType: 1, playType: 1, tournamentType: 1 });
VideoScoutingProfileSchema.index({ country: 1, city: 1 });
VideoScoutingProfileSchema.index({ playerPosition: 1, playerCategory: 1 });
VideoScoutingProfileSchema.index({ publicationStatus: 1, updatedAt: -1 });
VideoScoutingProfileSchema.index({ tournamentName: 1 });
VideoScoutingProfileSchema.index({ tags: 1 });

export default mongoose.model<IVideoScoutingProfile>(
  "VideoScoutingProfile",
  VideoScoutingProfileSchema,
  "video_scouting_profiles",
);
