"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workerResultEventSchema = exports.workerResultOutputSchema = exports.artifactManifestItemSchema = exports.artifactStorageSchema = exports.workerResultStatusSchema = exports.workerInboundEventSchema = exports.workerRetrySchema = exports.workerTracingSchema = void 0;
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
exports.artifactStorageSchema = zod_1.z.object({
    provider: zod_1.z.literal("s3"),
    status: zod_1.z.enum(["generated", "uploaded", "failed"]),
    s3Bucket: zod_1.z.string().min(1).optional(),
    s3Key: zod_1.z.string().min(1).optional(),
    s3Uri: zod_1.z.string().min(1).optional(),
});
exports.artifactManifestItemSchema = zod_1.z.object({
    artifactId: zod_1.z.string().min(1),
    artifactType: zod_1.z.enum([
        "json_result",
        "json_stats",
        "rendered_video",
        "image",
        "text_report",
        "zip",
        "other",
    ]),
    role: zod_1.z.enum([
        "primary_output",
        "supporting_output",
        "debug",
        "preview",
        "final_report",
    ]),
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().min(1).optional(),
    filename: zod_1.z.string().min(1),
    stepName: zod_1.z.string().min(1),
    toolName: zod_1.z.string().min(1),
    promptKey: zod_1.z.string().min(1).optional(),
    promptVersion: zod_1.z.string().min(1).optional(),
    storage: exports.artifactStorageSchema,
    mimeType: zod_1.z.string().min(1).optional(),
    fileSizeBytes: zod_1.z.number().int().nonnegative().optional(),
    isPrimary: zod_1.z.boolean(),
    schemaName: zod_1.z.string().min(1).optional(),
    schemaVersion: zod_1.z.string().min(1),
    preview: zod_1.z.record(zod_1.z.unknown()).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
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
    artifacts: zod_1.z.array(exports.artifactManifestItemSchema),
    operationalNotes: zod_1.z.array(zod_1.z.unknown()).optional(),
    requestId: zod_1.z.string().min(1),
    correlationId: zod_1.z.string().min(1),
    producedAt: isoUtcDateTimeSchema,
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