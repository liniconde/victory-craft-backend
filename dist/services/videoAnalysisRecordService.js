"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listVideoAnalysisRecordsByVideoId = exports.createVideoAnalysisRecord = exports.VideoAnalysisRecordServiceError = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const VideoAnalysisRecord_1 = __importDefault(require("../models/VideoAnalysisRecord"));
class VideoAnalysisRecordServiceError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.VideoAnalysisRecordServiceError = VideoAnalysisRecordServiceError;
const createVideoAnalysisRecord = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const created = yield VideoAnalysisRecord_1.default.findOneAndUpdate({ analysisJobId: params.analysisJobId }, {
        videoId: params.videoId,
        analysisJobId: params.analysisJobId,
        analysisType: params.analysisType,
        input: params.input || {},
        output: params.output || {},
        params: params.extraParams || {},
    }, { new: true, upsert: true, setDefaultsOnInsert: true });
    return (created === null || created === void 0 ? void 0 : created.toObject) ? created.toObject() : created;
});
exports.createVideoAnalysisRecord = createVideoAnalysisRecord;
const listVideoAnalysisRecordsByVideoId = (videoId, options) => __awaiter(void 0, void 0, void 0, function* () {
    if (!videoId || !mongoose_1.default.Types.ObjectId.isValid(videoId)) {
        throw new VideoAnalysisRecordServiceError(400, "invalid_video_id", "Invalid video id");
    }
    const page = Math.max(1, (options === null || options === void 0 ? void 0 : options.page) || 1);
    const limit = Math.min(100, Math.max(1, (options === null || options === void 0 ? void 0 : options.limit) || 20));
    const skip = (page - 1) * limit;
    const [items, total] = yield Promise.all([
        VideoAnalysisRecord_1.default.find({ videoId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
        VideoAnalysisRecord_1.default.countDocuments({ videoId }),
    ]);
    return {
        items: items.map((item) => (item.toObject ? item.toObject() : item)),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
        },
    };
});
exports.listVideoAnalysisRecordsByVideoId = listVideoAnalysisRecordsByVideoId;
//# sourceMappingURL=videoAnalysisRecordService.js.map