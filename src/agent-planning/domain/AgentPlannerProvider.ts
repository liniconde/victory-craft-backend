import { AgentPlannerProviderInput, AgentPlannerProviderOutput } from "./types";

export interface AgentPlannerProvider {
  plan(input: AgentPlannerProviderInput): Promise<AgentPlannerProviderOutput>;
}
