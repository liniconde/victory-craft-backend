"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentPlanningPromptService = exports.AGENT_PLAN_FALLBACK_SUMMARY = void 0;
exports.AGENT_PLAN_FALLBACK_SUMMARY = "No valid action could be planned.";
class AgentPlanningPromptService {
    buildSystemPrompt() {
        return `You are a frontend action planner.
You may only use actions provided in the request.
You should choose the smallest useful sequence of actions.
You must respond with JSON only.
Do not include markdown, explanations, or code fences.
Do not invent actions or arguments.
Exact output format:
{
  "summary": "string",
  "calls": [
    {
      "name": "string",
      "arguments": {}
    }
  ]
}`;
    }
    buildUserPrompt(request) {
        const payload = {
            prompt: request.prompt,
            currentPath: request.currentPath,
            actions: request.actions,
        };
        return `Plan the UI actions for this user request.
Return JSON only.
Request payload:\n${JSON.stringify(payload, null, 2)}`;
    }
}
exports.AgentPlanningPromptService = AgentPlanningPromptService;
//# sourceMappingURL=AgentPlanningPromptService.js.map