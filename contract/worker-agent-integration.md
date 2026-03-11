# Worker Agent SQS Integration

## Environment

Required variables:

- `AWS_REGION`
- `MCP_WORKER_AGENT_JOBS_SQS_URL`
- `MCP_WORKER_AGENT_RESULTS_SQS_URL`

Optional but common:

- `BUCKET_NAME`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Outbound correlation

Use these rules when building the outbound event:

- `eventId`: always a fresh UUID for the envelope event.
- `tracing.requestId`: always a fresh UUID for the worker request.
- `tracing.correlationId`: reuse the business case primary id when you want a stable end-to-end key. In this backend the default is the `AnalysisJob._id`.
- `tracing.traceId`: fresh UUID unless the caller already has a distributed tracing id.
- `idempotencyKey`: `tenant:eventType:businessEntityId:version`.

Current implementation for video analysis:

- `eventType`: `video.analysis.requested`
- `eventId`: `randomUUID()`
- `requestId`: `randomUUID()`
- `correlationId`: `AnalysisJob._id`
- `idempotencyKey`: `victorycraft:{analysisJobId}:v1`

Persist these values in the job row before or immediately after SQS send:

- `workerEventId`
- `workerRequestId`
- `workerCorrelationId`
- `workerTraceId`
- `workerIdempotencyKey`

## Response correlation

The worker result currently echoes `output.requestId` and `output.correlationId`, but not `idempotencyKey`.

Recommended resolution algorithm:

1. Find the job by `output.requestId`.
2. If not found, fall back to `output.correlationId`.
3. Before mutating domain state, verify you are updating the expected business entity using the stored `workerIdempotencyKey`.

This backend consumer stores the outbound triplet on `AnalysisJob` and updates the job on result arrival using `workerRequestId` or `workerCorrelationId`.

## Reusable entry points

- `sendWorkerEvent(event)` validates the outbound contract and publishes to the jobs queue.
- `buildWorkerInboundEvent(...)` creates a contract-compatible envelope.
- `createWorkerVideoAnalysisJob(videoId, payload)` is the application service used by the video analysis endpoint.
- `interpretWorkerResult(message)` validates and normalizes a result message.
- `pollWorkerResultsQueueOnce()` consumes the results queue and applies the result to `AnalysisJob`.
