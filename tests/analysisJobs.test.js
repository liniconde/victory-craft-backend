require("ts-node/register/transpile-only");

const test = require("node:test");
const assert = require("node:assert/strict");

const AnalysisJob = require("../src/models/AnalysisJob").default;
const Video = require("../src/models/Video").default;
const Notification = require("../src/models/Notification").default;
const queueService = require("../src/services/queueService");
const {
  createPromptAnalysisJob,
  getAnalysisJobStatus,
  AnalysisJobServiceError,
} = require("../src/services/analysisJobService");
const {
  deleteNotification,
  listNotifications,
  NotificationServiceError,
} = require("../src/services/notificationService");

const validVideoId = "67d123abc4567890def12345";
const validJobId = "67d123abc4567890def12346";

test("createPromptAnalysisJob crea job, encola y devuelve queued", async () => {
  const originalVideoExists = Video.exists;
  const originalCreate = AnalysisJob.create;
  const originalUpdate = AnalysisJob.findByIdAndUpdate;
  const originalCreateNotification = Notification.create;
  const originalSend = queueService.sendAnalysisJobToQueue;

  Video.exists = async () => true;
  AnalysisJob.create = async () => ({
    _id: validJobId,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    toObject: () => ({ _id: validJobId }),
  });
  AnalysisJob.findByIdAndUpdate = async () => ({
    toObject: () => ({
      _id: validJobId,
      videoId: validVideoId,
      analysisType: "agent_prompt",
      status: "queued",
      input: { prompt: "hola" },
      sqsMessageId: "msg-123",
    }),
  });
  Notification.create = async () => ({ toObject: () => ({ _id: "notif-1" }) });
  queueService.sendAnalysisJobToQueue = async () => "msg-123";

  try {
    const result = await createPromptAnalysisJob(validVideoId, {
      analysisType: "agent_prompt",
      prompt: "hola",
    });
    assert.equal(result.status, "queued");
    assert.equal(result.sqsMessageId, "msg-123");
  } finally {
    Video.exists = originalVideoExists;
    AnalysisJob.create = originalCreate;
    AnalysisJob.findByIdAndUpdate = originalUpdate;
    Notification.create = originalCreateNotification;
    queueService.sendAnalysisJobToQueue = originalSend;
  }
});

test("getAnalysisJobStatus retorna 404 si no existe", async () => {
  const originalFindOne = AnalysisJob.findOne;
  AnalysisJob.findOne = async () => null;

  try {
    await assert.rejects(
      () => getAnalysisJobStatus(validVideoId, validJobId),
      (error) => error instanceof AnalysisJobServiceError && error.code === "job_not_found",
    );
  } finally {
    AnalysisJob.findOne = originalFindOne;
  }
});

test("notifications list/delete funciona", async () => {
  const originalFind = Notification.find;
  const originalDelete = Notification.findByIdAndDelete;

  Notification.find = () => ({
    sort: () => ({
      limit: () => [
        { toObject: () => ({ _id: "n1", message: "queued" }) },
        { toObject: () => ({ _id: "n2", message: "completed" }) },
      ],
    }),
  });
  Notification.findByIdAndDelete = async () => ({ _id: "n1" });

  try {
    const rows = await listNotifications({ limit: 10 });
    assert.equal(rows.length, 2);
    const del = await deleteNotification("67d123abc4567890def12347");
    assert.equal(del.message, "Notification deleted successfully");
  } finally {
    Notification.find = originalFind;
    Notification.findByIdAndDelete = originalDelete;
  }
});

test("deleteNotification valida id invalido", async () => {
  await assert.rejects(
    () => deleteNotification("bad-id"),
    (error) =>
      error instanceof NotificationServiceError &&
      error.code === "invalid_notification_id",
  );
});
