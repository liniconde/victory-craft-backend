import { z } from "zod";

const isoUtcDateTimeSchema = z.string().datetime({ offset: true });

export const workerTracingSchema = z
  .object({
    requestId: z.string().min(1),
    correlationId: z.string().min(1),
    traceId: z.string().min(1),
  })
  .passthrough();

export const workerRetrySchema = z
  .object({
    attempt: z.number().int().min(0),
    maxAttempts: z.number().int().min(1),
  })
  .passthrough();

export const workerInboundEventSchema = z
  .object({
    contractVersion: z.literal("1.0"),
    eventId: z.string().min(1),
    eventType: z.string().min(1),
    occurredAt: isoUtcDateTimeSchema,
    tracing: workerTracingSchema,
    idempotencyKey: z.string().min(1),
    retry: workerRetrySchema,
    payload: z.record(z.unknown()),
  })
  .passthrough();

export const workerResultStatusSchema = z.enum(["SUCCESS", "PARTIAL_SUCCESS", "FAILED"]);

export const workerResultOutputSchema = z
  .object({
    eventType: z.string().min(1).optional(),
    status: z.string().min(1).optional(),
    planId: z.string().min(1).optional(),
    strategy: z.string().min(1).optional(),
    toolCallCount: z.number().int().min(0).optional(),
    toolSuccessCount: z.number().int().min(0).optional(),
    toolFailureCount: z.number().int().min(0).optional(),
    toolOutputs: z.array(z.unknown()).optional(),
    operationalNotes: z.array(z.unknown()).optional(),
    requestId: z.string().min(1).optional(),
    correlationId: z.string().min(1).optional(),
    producedAt: isoUtcDateTimeSchema.optional(),
  })
  .passthrough();

export const workerResultEventSchema = z
  .object({
    contractVersion: z.literal("1.0"),
    resultId: z.string().min(1),
    executionId: z.string().min(1),
    status: workerResultStatusSchema,
    summary: z.string().min(1),
    output: workerResultOutputSchema,
  })
  .passthrough();

export type WorkerInboundEvent = z.infer<typeof workerInboundEventSchema>;
export type WorkerResultStatus = z.infer<typeof workerResultStatusSchema>;
export type WorkerResultOutput = z.infer<typeof workerResultOutputSchema>;
export type WorkerResultEvent = z.infer<typeof workerResultEventSchema>;

export type WorkerVideoAnalysisPayload = {
  videoId: string;
  jobId: string;
  prompt: string;
  videoS3Uri: string;
  outputS3Prefix: string;
  localJobDir: string;
  render?: {
    toolName: string;
    outputDir: string;
    yoloModel?: string;
    processFps?: number;
    conf?: number;
  };
  stats?: {
    toolName: string;
    outputPath: string;
  };
  upload?: {
    toolName: string;
    bucket: string;
    destinationPrefix: string;
  };
  analysis?: {
    toolName: string;
    analysisPrompt: string;
  };
  [key: string]: unknown;
};
