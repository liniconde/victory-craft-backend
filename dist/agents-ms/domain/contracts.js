"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheRefreshSchema = exports.cacheRefreshRequestItemSchema = exports.cacheInvalidateSchema = exports.navigationCatalogUpsertSchema = exports.agentPlanV2ResponseSchema = exports.planMetaSchema = exports.agentPlanV2RequestSchema = exports.navigationCatalogSchema = exports.navigationCatalogEntrySchema = exports.agentPlanResponseSchema = exports.agentPlanRequestSchema = exports.plannerModelOutputSchema = exports.plannerCallSchema = exports.actionDefinitionSchema = exports.actionReturnSchema = exports.actionParameterSchema = void 0;
const zod_1 = require("zod");
const parameterTypeSchema = zod_1.z.enum(["string", "number", "boolean", "object", "array"]);
exports.actionParameterSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    type: parameterTypeSchema,
    description: zod_1.z.string().min(1),
    required: zod_1.z.boolean().optional().default(false),
    enum: zod_1.z.array(zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean()])).optional(),
});
exports.actionReturnSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    type: parameterTypeSchema,
    description: zod_1.z.string().min(1),
});
exports.actionDefinitionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    parameters: zod_1.z.array(exports.actionParameterSchema).optional().default([]),
    returns: zod_1.z.array(exports.actionReturnSchema).optional().default([]),
    tags: zod_1.z.array(zod_1.z.string().min(1)).optional().default([]),
});
exports.plannerCallSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    arguments: zod_1.z.record(zod_1.z.unknown()).optional().default({}),
});
exports.plannerModelOutputSchema = zod_1.z.object({
    summary: zod_1.z.string().min(1),
    calls: zod_1.z.array(exports.plannerCallSchema),
});
exports.agentPlanRequestSchema = zod_1.z.object({
    prompt: zod_1.z.string().min(1),
    currentPath: zod_1.z.string().min(1),
    actions: zod_1.z.array(exports.actionDefinitionSchema),
});
exports.agentPlanResponseSchema = exports.plannerModelOutputSchema;
exports.navigationCatalogEntrySchema = zod_1.z.object({
    route: zod_1.z.string().min(1),
    actionName: zod_1.z.string().min(1).default("navigation.go_to"),
    title: zod_1.z.string().min(1),
    section: zod_1.z.string().min(1).optional(),
    page: zod_1.z.string().min(1).optional(),
    subpage: zod_1.z.string().min(1).optional(),
    aliases: zod_1.z.array(zod_1.z.string().min(1)).optional().default([]),
    breadcrumbs: zod_1.z.array(zod_1.z.string().min(1)).optional().default([]),
    parents: zod_1.z.array(zod_1.z.string().min(1)).optional().default([]),
    intentTags: zod_1.z.array(zod_1.z.string().min(1)).optional().default([]),
    isLanding: zod_1.z.boolean().optional().default(false),
    popularity: zod_1.z.number().min(0).optional().default(0),
});
exports.navigationCatalogSchema = zod_1.z.object({
    version: zod_1.z.string().min(1),
    locale: zod_1.z.string().min(1).optional(),
    entries: zod_1.z.array(exports.navigationCatalogEntrySchema).min(1),
});
exports.agentPlanV2RequestSchema = exports.agentPlanRequestSchema.extend({
    locale: zod_1.z.string().min(1).optional(),
    navigationCatalogVersion: zod_1.z.string().min(1),
    navigationCatalog: exports.navigationCatalogSchema.optional(),
});
exports.planMetaSchema = zod_1.z.object({
    plannerMode: zod_1.z.enum(["deterministic", "llm", "llm_repaired", "fallback", "cache_hit"]),
    confidence: zod_1.z.number().min(0).max(1),
    selectedRoute: zod_1.z.string().min(1).optional(),
    navigationCatalogVersion: zod_1.z.string().min(1).optional(),
    traceId: zod_1.z.string().min(1),
    cacheKey: zod_1.z.string().min(1).optional(),
    cacheHit: zod_1.z.boolean().optional(),
    candidateRoutes: zod_1.z
        .array(zod_1.z.object({
        route: zod_1.z.string().min(1),
        score: zod_1.z.number().min(0).max(1),
    }))
        .optional(),
    validationWarnings: zod_1.z.array(zod_1.z.string().min(1)).optional(),
});
exports.agentPlanV2ResponseSchema = exports.plannerModelOutputSchema.extend({
    meta: exports.planMetaSchema,
});
exports.navigationCatalogUpsertSchema = zod_1.z.object({
    navigationCatalog: exports.navigationCatalogSchema,
});
exports.cacheInvalidateSchema = zod_1.z
    .object({
    all: zod_1.z.boolean().optional().default(false),
    catalogVersion: zod_1.z.string().min(1).optional(),
    prompt: zod_1.z.string().min(1).optional(),
})
    .refine((value) => value.all || value.catalogVersion || value.prompt, {
    message: "Provide all=true, catalogVersion, or prompt",
});
exports.cacheRefreshRequestItemSchema = exports.agentPlanV2RequestSchema.pick({
    prompt: true,
    currentPath: true,
    actions: true,
    locale: true,
    navigationCatalogVersion: true,
    navigationCatalog: true,
});
exports.cacheRefreshSchema = zod_1.z.object({
    requests: zod_1.z.array(exports.cacheRefreshRequestItemSchema).min(1).max(100),
    invalidateFirst: zod_1.z.boolean().optional().default(false),
});
//# sourceMappingURL=contracts.js.map