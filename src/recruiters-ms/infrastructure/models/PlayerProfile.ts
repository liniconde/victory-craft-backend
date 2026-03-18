import mongoose, { Document, Schema } from "mongoose";

export interface IPlayerProfile extends Document {
  userId?: mongoose.Types.ObjectId;
  email?: string;
  fullName: string;
  sportType?: string;
  primaryPosition?: string;
  secondaryPosition?: string;
  team?: string;
  category?: string;
  country?: string;
  city?: string;
  birthDate?: Date;
  dominantProfile?: string;
  bio?: string;
  avatarUrl?: string;
  status: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerProfileSchema = new Schema<IPlayerProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false, sparse: true, unique: true, index: true },
    email: { type: String, trim: true, lowercase: true, required: false, sparse: true, unique: true, index: true },
    fullName: { type: String, trim: true, required: true, index: true },
    sportType: { type: String, trim: true, index: true },
    primaryPosition: { type: String, trim: true, index: true },
    secondaryPosition: { type: String, trim: true, index: true },
    team: { type: String, trim: true, index: true },
    category: { type: String, trim: true, index: true },
    country: { type: String, trim: true, index: true },
    city: { type: String, trim: true, index: true },
    birthDate: { type: Date },
    dominantProfile: { type: String, trim: true, index: true },
    bio: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
    status: { type: String, trim: true, default: "active", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  },
  { timestamps: true },
);

PlayerProfileSchema.index({ fullName: 1, sportType: 1, team: 1 });
PlayerProfileSchema.index({ country: 1, city: 1, category: 1, status: 1 });

export default mongoose.model<IPlayerProfile>("PlayerProfile", PlayerProfileSchema, "player_profiles");
