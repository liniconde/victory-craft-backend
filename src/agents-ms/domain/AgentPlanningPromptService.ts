import { AgentPlanRequest, AgentPlanV2Request, NavigationCatalogEntry } from "./types";

export const AGENT_PLAN_FALLBACK_SUMMARY = "No valid action could be planned.";

export class AgentPlanningPromptService {
  buildSystemPrompt(): string {
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

  buildUserPrompt(request: AgentPlanRequest): string {
    const payload = {
      prompt: request.prompt,
      currentPath: request.currentPath,
      actions: request.actions,
    };

    return `Plan the UI actions for this user request.
Return JSON only.
Request payload:\n${JSON.stringify(payload, null, 2)}`;
  }

  buildUserPromptV2(request: AgentPlanV2Request, candidates: NavigationCatalogEntry[]): string {
    const payload = {
      prompt: request.prompt,
      currentPath: request.currentPath,
      locale: request.locale,
      actions: request.actions,
      navigationCandidates: candidates.map((candidate) => ({
        route: candidate.route,
        title: candidate.title,
        aliases: candidate.aliases,
        breadcrumbs: candidate.breadcrumbs,
        section: candidate.section,
        page: candidate.page,
        subpage: candidate.subpage,
      })),
    };

    return `Plan the UI actions for this user request.
If you choose navigation.go_to, prefer one of the provided navigationCandidates.
Return JSON only.
Request payload:\n${JSON.stringify(payload, null, 2)}`;
  }
}
