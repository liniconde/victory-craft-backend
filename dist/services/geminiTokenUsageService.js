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
exports.getGeminiTokenUsageSummary = exports.getLastGeminiTokenUsage = exports.registerGeminiUsageFromGenerateResponse = exports.registerGeminiUsage = void 0;
const GeminiTokenUsage_1 = __importDefault(require("../models/GeminiTokenUsage"));
const MAX_USAGE_HISTORY = 10;
const usageHistory = [];
const normalizeCount = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};
const registerGeminiUsage = (params) => __awaiter(void 0, void 0, void 0, function* () {
    if (!params.usageMetadata || typeof params.usageMetadata !== "object") {
        return null;
    }
    const entry = {
        model: params.model,
        at: new Date().toISOString(),
        source: params.source,
        usageMetadata: params.usageMetadata,
        totalTokenCount: normalizeCount(params.usageMetadata.totalTokenCount),
        promptTokenCount: normalizeCount(params.usageMetadata.promptTokenCount),
        candidatesTokenCount: normalizeCount(params.usageMetadata.candidatesTokenCount),
    };
    usageHistory.push(entry);
    if (usageHistory.length > MAX_USAGE_HISTORY) {
        usageHistory.shift();
    }
    try {
        yield GeminiTokenUsage_1.default.create({
            modelName: entry.model,
            source: entry.source,
            usageMetadata: entry.usageMetadata,
            totalTokenCount: entry.totalTokenCount,
            promptTokenCount: entry.promptTokenCount,
            candidatesTokenCount: entry.candidatesTokenCount,
        });
    }
    catch (error) {
        console.error("Failed to persist Gemini token usage:", (error === null || error === void 0 ? void 0 : error.message) || error);
    }
    return entry;
});
exports.registerGeminiUsage = registerGeminiUsage;
const registerGeminiUsageFromGenerateResponse = (model, response, source) => {
    const usageMetadata = response === null || response === void 0 ? void 0 : response.usageMetadata;
    if (!usageMetadata) {
        return null;
    }
    return (0, exports.registerGeminiUsage)({
        model,
        usageMetadata,
        source,
    });
};
exports.registerGeminiUsageFromGenerateResponse = registerGeminiUsageFromGenerateResponse;
const getLastGeminiTokenUsage = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const dbLast = yield GeminiTokenUsage_1.default.findOne().sort({ createdAt: -1 }).lean();
    if (dbLast) {
        return {
            model: dbLast.modelName,
            at: dbLast.createdAt.toISOString(),
            source: dbLast.source,
            usageMetadata: dbLast.usageMetadata || {},
            totalTokenCount: (_a = dbLast.totalTokenCount) !== null && _a !== void 0 ? _a : null,
            promptTokenCount: (_b = dbLast.promptTokenCount) !== null && _b !== void 0 ? _b : null,
            candidatesTokenCount: (_c = dbLast.candidatesTokenCount) !== null && _c !== void 0 ? _c : null,
        };
    }
    return usageHistory.length ? usageHistory[usageHistory.length - 1] : null;
});
exports.getLastGeminiTokenUsage = getLastGeminiTokenUsage;
const getGeminiTokenUsageSummary = () => __awaiter(void 0, void 0, void 0, function* () {
    const last = yield (0, exports.getLastGeminiTokenUsage)();
    const [totalsAgg, historySize, recent] = yield Promise.all([
        GeminiTokenUsage_1.default.aggregate([
            {
                $group: {
                    _id: null,
                    requests: { $sum: 1 },
                    totalTokenCount: { $sum: { $ifNull: ["$totalTokenCount", 0] } },
                    promptTokenCount: { $sum: { $ifNull: ["$promptTokenCount", 0] } },
                    candidatesTokenCount: { $sum: { $ifNull: ["$candidatesTokenCount", 0] } },
                },
            },
        ]),
        GeminiTokenUsage_1.default.countDocuments({}),
        GeminiTokenUsage_1.default.find()
            .sort({ createdAt: -1 })
            .limit(MAX_USAGE_HISTORY)
            .lean(),
    ]);
    if (!historySize) {
        const inMemoryTotals = usageHistory.reduce((acc, item) => {
            acc.requests += 1;
            acc.totalTokenCount += item.totalTokenCount || 0;
            acc.promptTokenCount += item.promptTokenCount || 0;
            acc.candidatesTokenCount += item.candidatesTokenCount || 0;
            return acc;
        }, {
            requests: 0,
            totalTokenCount: 0,
            promptTokenCount: 0,
            candidatesTokenCount: 0,
        });
        return {
            last,
            totals: inMemoryTotals,
            historySize: usageHistory.length,
            recent: [...usageHistory].reverse(),
        };
    }
    const totals = (totalsAgg === null || totalsAgg === void 0 ? void 0 : totalsAgg[0]) || {
        requests: 0,
        totalTokenCount: 0,
        promptTokenCount: 0,
        candidatesTokenCount: 0,
    };
    return {
        last,
        totals: {
            requests: totals.requests || 0,
            totalTokenCount: totals.totalTokenCount || 0,
            promptTokenCount: totals.promptTokenCount || 0,
            candidatesTokenCount: totals.candidatesTokenCount || 0,
        },
        historySize,
        recent: recent
            .map((item) => {
            var _a, _b, _c;
            return ({
                model: item.modelName,
                at: item.createdAt.toISOString(),
                source: item.source,
                usageMetadata: item.usageMetadata || {},
                totalTokenCount: (_a = item.totalTokenCount) !== null && _a !== void 0 ? _a : null,
                promptTokenCount: (_b = item.promptTokenCount) !== null && _b !== void 0 ? _b : null,
                candidatesTokenCount: (_c = item.candidatesTokenCount) !== null && _c !== void 0 ? _c : null,
            });
        })
            .reverse(),
    };
});
exports.getGeminiTokenUsageSummary = getGeminiTokenUsageSummary;
//# sourceMappingURL=geminiTokenUsageService.js.map