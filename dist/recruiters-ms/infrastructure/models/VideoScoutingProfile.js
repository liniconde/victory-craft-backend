"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const sportTypes_1 = require("../../../shared/sportTypes");
const VideoScoutingProfileSchema = new mongoose_1.Schema({
    videoId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Video", required: true, unique: true, index: true },
    playerProfileId: { type: mongoose_1.Schema.Types.ObjectId, ref: "PlayerProfile", required: false, index: true },
    publicationStatus: {
        type: String,
        enum: ["draft", "published", "archived"],
        required: true,
        default: "published",
        index: true,
    },
    title: { type: String, trim: true },
    sportType: { type: String, trim: true, enum: sportTypes_1.SPORT_TYPES, set: sportTypes_1.normalizeSportType, index: true },
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
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: false },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: false },
}, { timestamps: true });
VideoScoutingProfileSchema.index({ sportType: 1, playType: 1, tournamentType: 1 });
VideoScoutingProfileSchema.index({ country: 1, city: 1 });
VideoScoutingProfileSchema.index({ playerPosition: 1, playerCategory: 1 });
VideoScoutingProfileSchema.index({ publicationStatus: 1, updatedAt: -1 });
VideoScoutingProfileSchema.index({ tournamentName: 1 });
VideoScoutingProfileSchema.index({ tags: 1 });
exports.default = mongoose_1.default.model("VideoScoutingProfile", VideoScoutingProfileSchema, "video_scouting_profiles");
//# sourceMappingURL=VideoScoutingProfile.js.map