"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentPlanResponseSchema = exports.plannerModelOutputSchema = exports.plannerCallSchema = exports.agentPlanRequestSchema = exports.actionDefinitionSchema = exports.actionReturnSchema = exports.actionParameterSchema = void 0;
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
exports.agentPlanRequestSchema = zod_1.z.object({
    prompt: zod_1.z.string().min(1),
    currentPath: zod_1.z.string().min(1),
    actions: zod_1.z.array(exports.actionDefinitionSchema),
});
exports.plannerCallSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    arguments: zod_1.z.record(zod_1.z.unknown()).optional().default({}),
});
exports.plannerModelOutputSchema = zod_1.z.object({
    summary: zod_1.z.string().min(1),
    calls: zod_1.z.array(exports.plannerCallSchema),
});
exports.agentPlanResponseSchema = exports.plannerModelOutputSchema;
//# sourceMappingURL=schemas.js.map