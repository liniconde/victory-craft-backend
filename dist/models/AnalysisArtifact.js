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
const AnalysisArtifactSchema = new mongoose_1.Schema({
    videoId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Video", required: true, index: true },
    analysisJobId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "AnalysisJob",
        required: true,
        index: true,
    },
    flow: {
        type: String,
        enum: ["gemini", "agent"],
        required: true,
        default: "agent",
    },
    producer: {
        type: String,
        enum: ["gemini", "mcp_worker_agent", "unknown"],
        required: true,
        default: "unknown",
    },
    artifactType: {
        type: String,
        enum: ["json_result", "json_stats", "rendered_video", "image", "text_report", "zip", "other"],
        required: true,
        default: "other",
    },
    role: {
        type: String,
        enum: ["primary_output", "supporting_output", "debug", "preview", "final_report"],
        required: true,
        default: "supporting_output",
    },
    promptKey: { type: String, required: false },
    promptVersion: { type: String, required: false },
    schemaName: { type: String, required: false },
    schemaVersion: { type: String, required: false },
    s3Bucket: { type: String, required: true },
    s3Key: { type: String, required: true },
    s3Uri: { type: String, required: true },
    mimeType: { type: String, required: false },
    fileSizeBytes: { type: Number, required: false },
    filename: { type: String, required: false },
    title: { type: String, required: false },
    description: { type: String, required: false },
    stepName: { type: String, required: false },
    toolName: { type: String, required: false },
    status: {
        type: String,
        enum: ["generated", "uploaded", "failed"],
        required: true,
        default: "uploaded",
    },
    isPrimary: { type: Boolean, required: false, default: false },
    metadata: { type: mongoose_1.Schema.Types.Mixed, required: false },
    preview: { type: mongoose_1.Schema.Types.Mixed, required: false },
}, { timestamps: true });
AnalysisArtifactSchema.index({ analysisJobId: 1, s3Key: 1 }, { unique: true });
exports.default = mongoose_1.default.model("AnalysisArtifact", AnalysisArtifactSchema);
//# sourceMappingURL=AnalysisArtifact.js.map