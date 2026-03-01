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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListVideoAnalysisRecords = void 0;
const videoAnalysisRecordService_1 = require("../services/videoAnalysisRecordService");
const handleListVideoAnalysisRecords = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: videoId } = req.params;
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const result = yield (0, videoAnalysisRecordService_1.listVideoAnalysisRecordsByVideoId)(videoId, { page, limit });
        res.status(200).json(result);
    }
    catch (error) {
        if (error instanceof videoAnalysisRecordService_1.VideoAnalysisRecordServiceError) {
            res.status(error.status).json({ message: error.message, code: error.code });
            return;
        }
        res.status(500).json({ message: error.message || "Internal server error" });
    }
});
exports.handleListVideoAnalysisRecords = handleListVideoAnalysisRecords;
//# sourceMappingURL=videoAnalysisRecordController.js.map