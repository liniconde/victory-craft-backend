require("ts-node/register/transpile-only");

const test = require("node:test");
const assert = require("node:assert/strict");

const AnalysisJob = require("../src/models/AnalysisJob").default;
const aiAnalysisService = require("../src/services/aiAnalysisService");
const notificationService = require("../src/services/notificationService");
const videoAnalysisRecordService = require("../src/services/videoAnalysisRecordService");
const {
  processAnalysisJobQueueMessage,
} = require("../src/services/analysisJobsConsumerService");

const message = {
  jobId: "67d123abc4567890def12346",
  videoId: "67d123abc4567890def12345",
  analysisType: "agent_prompt",
  input: { prompt: "Resume jugadas clave" },
};

test("processAnalysisJobQueueMessage marca completed y guarda output", async () => {
  const originalFindById = AnalysisJob.findById;
  const originalFindByIdAndUpdate = AnalysisJob.findByIdAndUpdate;
  const originalAnalyze = aiAnalysisService.analyzeVideoWithPrompt;
  const originalCreateNotification = notificationService.createNotification;
  const originalCreateRecord = videoAnalysisRecordService.createVideoAnalysisRecord;

  const updates = [];
  let createdRecordPayload = null;
  AnalysisJob.findById = async () => ({ _id: message.jobId });
  AnalysisJob.findByIdAndUpdate = async (_id, update) => {
    updates.push(update);
    return null;
  };
  aiAnalysisService.analyzeVideoWithPrompt = async () => ({
    output: { summary: "ok" },
    message: "Analysis generated successfully.",
  });
  notificationService.createNotification = async () => ({ _id: "n1" });
  videoAnalysisRecordService.createVideoAnalysisRecord = async (payload) => {
    createdRecordPayload = payload;
    return { _id: "record-1" };
  };

  try {
    await processAnalysisJobQueueMessage(message);
    assert.equal(updates[0].status, "in_progress");
    assert.equal(updates[1].status, "completed");
    assert.ok(updates[1].output);
    assert.ok(createdRecordPayload);
    assert.equal(createdRecordPayload.videoId, message.videoId);
    assert.equal(createdRecordPayload.analysisJobId, message.jobId);
  } finally {
    AnalysisJob.findById = originalFindById;
    AnalysisJob.findByIdAndUpdate = originalFindByIdAndUpdate;
    aiAnalysisService.analyzeVideoWithPrompt = originalAnalyze;
    notificationService.createNotification = originalCreateNotification;
    videoAnalysisRecordService.createVideoAnalysisRecord = originalCreateRecord;
  }
});

test("processAnalysisJobQueueMessage marca failed cuando Gemini falla", async () => {
  const originalFindById = AnalysisJob.findById;
  const originalFindByIdAndUpdate = AnalysisJob.findByIdAndUpdate;
  const originalAnalyze = aiAnalysisService.analyzeVideoWithPrompt;
  const originalCreateNotification = notificationService.createNotification;

  const updates = [];
  AnalysisJob.findById = async () => ({ _id: message.jobId });
  AnalysisJob.findByIdAndUpdate = async (_id, update) => {
    updates.push(update);
    return null;
  };
  aiAnalysisService.analyzeVideoWithPrompt = async () => {
    throw new Error("gemini timeout");
  };
  notificationService.createNotification = async () => ({ _id: "n2" });

  try {
    await processAnalysisJobQueueMessage(message);
    assert.equal(updates[0].status, "in_progress");
    assert.equal(updates[1].status, "failed");
    assert.equal(updates[1].errorMessage, "gemini timeout");
  } finally {
    AnalysisJob.findById = originalFindById;
    AnalysisJob.findByIdAndUpdate = originalFindByIdAndUpdate;
    aiAnalysisService.analyzeVideoWithPrompt = originalAnalyze;
    notificationService.createNotification = originalCreateNotification;
  }
});
