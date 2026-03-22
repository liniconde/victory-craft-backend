import { AgentPlannerProvider } from "../../domain/AgentPlannerProvider";
import { GeminiAgentPlannerProvider } from "../gemini/GeminiAgentPlannerProvider";

export const createAgentPlannerProvider = (): AgentPlannerProvider => {
  const provider = (process.env.AGENT_PLANNER_PROVIDER || "gemini").toLowerCase();

  if (provider === "gemini") {
    return new GeminiAgentPlannerProvider();
  }

  throw new Error(`Unsupported AGENT_PLANNER_PROVIDER: ${provider}`);
};
