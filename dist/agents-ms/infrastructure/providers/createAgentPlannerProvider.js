"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentPlannerProvider = void 0;
const GeminiAgentPlannerProvider_1 = require("../gemini/GeminiAgentPlannerProvider");
const createAgentPlannerProvider = () => {
    const provider = (process.env.AGENT_PLANNER_PROVIDER || "gemini").toLowerCase();
    if (provider === "gemini") {
        return new GeminiAgentPlannerProvider_1.GeminiAgentPlannerProvider();
    }
    throw new Error(`Unsupported AGENT_PLANNER_PROVIDER: ${provider}`);
};
exports.createAgentPlannerProvider = createAgentPlannerProvider;
//# sourceMappingURL=createAgentPlannerProvider.js.map