import { z } from "zod";
import {
  agentPlanRequestSchema,
  agentPlanResponseSchema,
  plannerModelOutputSchema,
} from "./schemas";

export type AgentParameterType = "string" | "number" | "boolean" | "object" | "array";

export type AgentPlanRequest = z.infer<typeof agentPlanRequestSchema>;
export type AgentPlanResponse = z.infer<typeof agentPlanResponseSchema>;
export type PlannerModelOutput = z.infer<typeof plannerModelOutputSchema>;

export type AgentPlannerProviderInput = {
  systemPrompt: string;
  userPrompt: string;
  timeoutMs?: number;
};

export type AgentPlannerProviderOutput = {
  provider: string;
  model: string;
  text: string;
};
