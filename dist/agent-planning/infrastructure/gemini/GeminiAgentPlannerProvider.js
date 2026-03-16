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
exports.GeminiAgentPlannerProvider = void 0;
const generative_ai_1 = require("@google/generative-ai");
const withTimeout = (promise, timeoutMs) => __awaiter(void 0, void 0, void 0, function* () {
    if (!timeoutMs || timeoutMs <= 0) {
        return promise;
    }
    return Promise.race([
        promise,
        new Promise((_resolve, reject) => {
            setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs);
        }),
    ]);
});
class GeminiAgentPlannerProvider {
    constructor(config) {
        var _a, _b;
        const apiKey = (config === null || config === void 0 ? void 0 : config.apiKey) || process.env.GEMINI_API_KEY || "";
        const model = (config === null || config === void 0 ? void 0 : config.model) || process.env.AGENT_PLANNER_GEMINI_MODEL || "gemini-2.5-flash";
        const temperature = Number((_b = (_a = config === null || config === void 0 ? void 0 : config.temperature) !== null && _a !== void 0 ? _a : process.env.AGENT_PLANNER_GEMINI_TEMPERATURE) !== null && _b !== void 0 ? _b : 0);
        if (!apiKey) {
            throw new Error("Missing GEMINI_API_KEY for agent planner provider");
        }
        this.config = {
            apiKey,
            model,
            temperature,
        };
        this.client = new generative_ai_1.GoogleGenerativeAI(this.config.apiKey);
    }
    plan(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const model = this.client.getGenerativeModel({
                model: this.config.model,
                generationConfig: {
                    temperature: this.config.temperature,
                    responseMimeType: "application/json",
                },
            });
            const prompt = `${input.systemPrompt}\n\nUser request:\n${input.userPrompt}`;
            const result = yield withTimeout(model.generateContent([{ text: prompt }]), input.timeoutMs || 0);
            const response = yield result.response;
            return {
                provider: "gemini",
                model: this.config.model,
                text: response.text(),
            };
        });
    }
}
exports.GeminiAgentPlannerProvider = GeminiAgentPlannerProvider;
//# sourceMappingURL=GeminiAgentPlannerProvider.js.map