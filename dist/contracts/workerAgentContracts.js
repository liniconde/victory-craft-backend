"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workerResultEventSchema = exports.workerResultOutputSchema = exports.workerResultStatusSchema = exports.workerInboundEventSchema = exports.workerRetrySchema = exports.workerTracingSchema = void 0;
const zod_1 = require("zod");
const isoUtcDateTimeSchema = zod_1.z.string().datetime({ offset: true });
exports.workerTracingSchema = zod_1.z
    .object({
    requestId: zod_1.z.string().min(1),
    correlationId: zod_1.z.string().min(1),
    traceId: zod_1.z.string().min(1),
})
    .passthrough();
exports.workerRetrySchema = zod_1.z
    .object({
    attempt: zod_1.z.number().int().min(0),
    maxAttempts: zod_1.z.number().int().min(1),
})
    .passthrough();
exports.workerInboundEventSchema = zod_1.z
    .object({
    contractVersion: zod_1.z.literal("1.0"),
    eventId: zod_1.z.string().min(1),
    eventType: zod_1.z.string().min(1),
    occurredAt: isoUtcDateTimeSchema,
    tracing: exports.workerTracingSchema,
    idempotencyKey: zod_1.z.string().min(1),
    retry: exports.workerRetrySchema,
    payload: zod_1.z.record(zod_1.z.unknown()),
})
    .passthrough();
exports.workerResultStatusSchema = zod_1.z.enum(["SUCCESS", "PARTIAL_SUCCESS", "FAILED"]);
exports.workerResultOutputSchema = zod_1.z
    .object({
    eventType: zod_1.z.string().min(1).optional(),
    status: zod_1.z.string().min(1).optional(),
    planId: zod_1.z.string().min(1).optional(),
    strategy: zod_1.z.string().min(1).optional(),
    toolCallCount: zod_1.z.number().int().min(0).optional(),
    toolSuccessCount: zod_1.z.number().int().min(0).optional(),
    toolFailureCount: zod_1.z.number().int().min(0).optional(),
    toolOutputs: zod_1.z.array(zod_1.z.unknown()).optional(),
    operationalNotes: zod_1.z.array(zod_1.z.unknown()).optional(),
    requestId: zod_1.z.string().min(1).optional(),
    correlationId: zod_1.z.string().min(1).optional(),
    producedAt: isoUtcDateTimeSchema.optional(),
})
    .passthrough();
exports.workerResultEventSchema = zod_1.z
    .object({
    contractVersion: zod_1.z.literal("1.0"),
    resultId: zod_1.z.string().min(1),
    executionId: zod_1.z.string().min(1),
    status: exports.workerResultStatusSchema,
    summary: zod_1.z.string().min(1),
    output: exports.workerResultOutputSchema,
})
    .passthrough();
//# sourceMappingURL=workerAgentContracts.js.map