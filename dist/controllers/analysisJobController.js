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
exports.handleGetAnalyzeVideoJobStatus = exports.handleCreateAnalyzeAgentJob = exports.handleCreateAnalyzeVideoJob = void 0;
const analysisJobService_1 = require("../services/analysisJobService");
const workerAgentService_1 = require("../services/workerAgentService");
const handleError = (res, error) => {
    if (error instanceof analysisJobService_1.AnalysisJobServiceError) {
        res.status(error.status).json({ message: error.message, code: error.code });
        return;
    }
    if (error instanceof workerAgentService_1.WorkerAgentServiceError) {
        res.status(error.status).json({ message: error.message, code: error.code });
        return;
    }
    res.status(500).json({ message: error.message || "Internal server error" });
};
const handleCreateAnalyzeVideoJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: videoId } = req.params;
        const result = yield (0, analysisJobService_1.createPromptAnalysisJob)(videoId, req.body || {});
        res.status(201).json({
            message: "Legacy analysis job created and queued",
            job: result,
        });
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleCreateAnalyzeVideoJob = handleCreateAnalyzeVideoJob;
const handleCreateAnalyzeAgentJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: videoId } = req.params;
        const result = yield (0, analysisJobService_1.createAgentPromptAnalysisJob)(videoId, req.body || {});
        res.status(201).json({
            message: "Agent analysis job created and queued",
            job: result,
        });
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleCreateAnalyzeAgentJob = handleCreateAnalyzeAgentJob;
const handleGetAnalyzeVideoJobStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: videoId, jobId } = req.params;
        const result = yield (0, analysisJobService_1.getAnalysisJobStatus)(videoId, jobId);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleGetAnalyzeVideoJobStatus = handleGetAnalyzeVideoJobStatus;
//# sourceMappingURL=analysisJobController.js.map