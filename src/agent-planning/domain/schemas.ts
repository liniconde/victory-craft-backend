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

export const agentPlanRequestSchema = z.object({
  prompt: z.string().min(1),
  currentPath: z.string().min(1),
  actions: z.array(actionDefinitionSchema),
});

export const plannerCallSchema = z.object({
  name: z.string().min(1),
  arguments: z.record(z.unknown()).optional().default({}),
});

export const plannerModelOutputSchema = z.object({
  summary: z.string().min(1),
  calls: z.array(plannerCallSchema),
});

export const agentPlanResponseSchema = plannerModelOutputSchema;
