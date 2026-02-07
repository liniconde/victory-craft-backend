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
exports.analyzeVideoController = void 0;
const aiAnalysisService_1 = require("../services/aiAnalysisService");
const analyzeVideoController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { videoId } = req.params;
        // Prompt is now determined internally by the service based on sport type
        const analysis = yield (0, aiAnalysisService_1.analyzeVideo)(videoId);
        res.json(analysis);
        return;
    }
    catch (error) {
        console.error("Error in analyzeVideoController:", error);
        res.status(500).json({ error: error.message });
        return;
    }
});
exports.analyzeVideoController = analyzeVideoController;
//# sourceMappingURL=aiAnalysisController.js.map