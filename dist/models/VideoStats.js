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
const MatchMetricSchema = new mongoose_1.Schema({
    total: { type: Number, default: 0, required: true },
    teamA: { type: Number, default: 0, required: true },
    teamB: { type: Number, default: 0, required: true },
}, { _id: false });
const ManualEventSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    time: { type: Number, required: true, min: 0 },
    type: {
        type: String,
        enum: ["pass", "shot", "goal", "foul", "other"],
        required: true,
    },
    team: { type: String, enum: ["A", "B"], required: true },
    note: { type: String, maxlength: 500 },
}, { _id: false });
const VideoStatsSchema = new mongoose_1.Schema({
    videoId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Video",
        required: true,
        unique: true,
    },
    sportType: {
        type: String,
        enum: ["football", "padel", "tennis", "basketball", "other"],
        required: true,
    },
    teamAName: { type: String, required: false },
    teamBName: { type: String, required: false },
    teams: [
        {
            teamKey: { type: String, enum: ["A", "B"], required: false },
            teamName: { type: String, required: true },
            stats: { type: Object, default: {} },
        },
    ],
    matchStats: {
        passes: { type: MatchMetricSchema, required: false },
        shots: { type: MatchMetricSchema, required: false },
        goals: { type: MatchMetricSchema, required: false },
        fouls: { type: MatchMetricSchema, required: false },
        others: { type: MatchMetricSchema, required: false },
    },
    events: {
        type: [ManualEventSchema],
        required: false,
        default: undefined,
    },
    summary: { type: String, default: "" },
    generatedByModel: {
        type: String,
        enum: [
            "manual",
            "OpenPose",
            "YOLOv8",
            "DeepSportAnalyzer",
            "BallTrackNet",
            "Gemini-2.0-Flash",
            "custom",
        ],
        required: true,
        default: "manual",
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("VideoStats", VideoStatsSchema);
//# sourceMappingURL=VideoStats.js.map