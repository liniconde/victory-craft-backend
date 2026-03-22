import { z } from "zod";

const parameterTypeSchema = z.enum(["string", "number", "boolean", "object", "array"]);

export const actionParameterSchema = z.object({
  name: z.string().min(1),
  type: parameterTypeSchema,
  description: z.string().min(1),
  required: z.boolean().optional().default(false),
  enum: z.array(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export const actionReturnSchema = z.object({
  name: z.string().min(1),
  type: parameterTypeSchema,
  description: z.string().min(1),
});

export const actionDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  parameters: z.array(actionParameterSchema).optional().default([]),
  returns: z.array(actionReturnSchema).optional().default([]),
  tags: z.array(z.string().min(1)).optional().default([]),
});

export const plannerCallSchema = z.object({
  name: z.string().min(1),
  arguments: z.record(z.unknown()).optional().default({}),
});

export const plannerModelOutputSchema = z.object({
  summary: z.string().min(1),
  calls: z.array(plannerCallSchema),
});

export const agentPlanRequestSchema = z.object({
  prompt: z.string().min(1),
  currentPath: z.string().min(1),
  actions: z.array(actionDefinitionSchema),
});

export const agentPlanResponseSchema = plannerModelOutputSchema;

export const navigationCatalogEntrySchema = z.object({
  route: z.string().min(1),
  actionName: z.string().min(1).default("navigation.go_to"),
  title: z.string().min(1),
  section: z.string().min(1).optional(),
  page: z.string().min(1).optional(),
  subpage: z.string().min(1).optional(),
  aliases: z.array(z.string().min(1)).optional().default([]),
  breadcrumbs: z.array(z.string().min(1)).optional().default([]),
  parents: z.array(z.string().min(1)).optional().default([]),
  intentTags: z.array(z.string().min(1)).optional().default([]),
  isLanding: z.boolean().optional().default(false),
  popularity: z.number().min(0).optional().default(0),
});

export const navigationCatalogSchema = z.object({
  version: z.string().min(1),
  locale: z.string().min(1).optional(),
  entries: z.array(navigationCatalogEntrySchema).min(1),
});

export const agentPlanV2RequestSchema = agentPlanRequestSchema.extend({
  locale: z.string().min(1).optional(),
  navigationCatalogVersion: z.string().min(1),
  navigationCatalog: navigationCatalogSchema.optional(),
});

export const planMetaSchema = z.object({
  plannerMode: z.enum(["deterministic", "llm", "llm_repaired", "fallback", "cache_hit"]),
  confidence: z.number().min(0).max(1),
  selectedRoute: z.string().min(1).optional(),
  navigationCatalogVersion: z.string().min(1).optional(),
  traceId: z.string().min(1),
  cacheKey: z.string().min(1).optional(),
  cacheHit: z.boolean().optional(),
  candidateRoutes: z
    .array(
      z.object({
        route: z.string().min(1),
        score: z.number().min(0).max(1),
      }),
    )
    .optional(),
  validationWarnings: z.array(z.string().min(1)).optional(),
});

export const agentPlanV2ResponseSchema = plannerModelOutputSchema.extend({
  meta: planMetaSchema,
});

export const navigationCatalogUpsertSchema = z.object({
  navigationCatalog: navigationCatalogSchema,
});

export const cacheInvalidateSchema = z
  .object({
    all: z.boolean().optional().default(false),
    catalogVersion: z.string().min(1).optional(),
    prompt: z.string().min(1).optional(),
  })
  .refine((value) => value.all || value.catalogVersion || value.prompt, {
    message: "Provide all=true, catalogVersion, or prompt",
  });

export const cacheRefreshRequestItemSchema = agentPlanV2RequestSchema.pick({
  prompt: true,
  currentPath: true,
  actions: true,
  locale: true,
  navigationCatalogVersion: true,
  navigationCatalog: true,
});

export const cacheRefreshSchema = z.object({
  requests: z.array(cacheRefreshRequestItemSchema).min(1).max(100),
  invalidateFirst: z.boolean().optional().default(false),
});

export type CacheRefreshDto = z.infer<typeof cacheRefreshSchema>;
