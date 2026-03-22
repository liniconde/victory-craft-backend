import { z } from "zod";
import {
  actionDefinitionSchema,
  agentPlanRequestSchema,
  agentPlanResponseSchema,
  agentPlanV2RequestSchema,
  agentPlanV2ResponseSchema,
  cacheInvalidateSchema,
  cacheRefreshSchema,
  navigationCatalogSchema,
  navigationCatalogUpsertSchema,
  plannerModelOutputSchema,
} from "./contracts";

export type AgentParameterType = "string" | "number" | "boolean" | "object" | "array";

export type AgentActionDefinition = z.infer<typeof actionDefinitionSchema>;
export type AgentPlanRequest = z.infer<typeof agentPlanRequestSchema>;
export type AgentPlanResponse = z.infer<typeof agentPlanResponseSchema>;
export type AgentPlanV2Request = z.infer<typeof agentPlanV2RequestSchema>;
export type AgentPlanV2Response = z.infer<typeof agentPlanV2ResponseSchema>;
export type PlannerModelOutput = z.infer<typeof plannerModelOutputSchema>;
export type NavigationCatalog = z.infer<typeof navigationCatalogSchema>;
export type NavigationCatalogEntry = NavigationCatalog["entries"][number];
export type NavigationCatalogUpsertDto = z.infer<typeof navigationCatalogUpsertSchema>;
export type CacheInvalidateDto = z.infer<typeof cacheInvalidateSchema>;
export type CacheRefreshDto = z.infer<typeof cacheRefreshSchema>;

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

export type PlannerCacheSource = "deterministic" | "llm";

export type PlanCacheEntry = {
  key: string;
  catalogVersion: string;
  promptNormalized: string;
  currentPath: string;
  locale?: string;
  actionsFingerprint: string;
  response: AgentPlanV2Response;
  source: PlannerCacheSource;
  confidence: number;
};
