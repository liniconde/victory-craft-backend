require("ts-node/register/transpile-only");

const test = require("node:test");
const assert = require("node:assert/strict");

const VideoAnalysisRecord = require("../src/models/VideoAnalysisRecord").default;
const {
  listVideoAnalysisRecordsByVideoId,
  VideoAnalysisRecordServiceError,
} = require("../src/services/videoAnalysisRecordService");

const validVideoId = "67d123abc4567890def12345";

test("listVideoAnalysisRecordsByVideoId retorna formato paginado", async () => {
  const originalFind = VideoAnalysisRecord.find;
  const originalCount = VideoAnalysisRecord.countDocuments;

  VideoAnalysisRecord.find = () => ({
    sort: () => ({
      skip: () => ({
        limit: () => [
          { toObject: () => ({ _id: "r1", videoId: validVideoId }) },
          { toObject: () => ({ _id: "r2", videoId: validVideoId }) },
        ],
      }),
    }),
  });
  VideoAnalysisRecord.countDocuments = async () => 2;

  try {
    const result = await listVideoAnalysisRecordsByVideoId(validVideoId, {
      page: 1,
      limit: 20,
    });
    assert.equal(result.items.length, 2);
    assert.equal(result.pagination.total, 2);
    assert.equal(result.pagination.totalPages, 1);
  } finally {
    VideoAnalysisRecord.find = originalFind;
    VideoAnalysisRecord.countDocuments = originalCount;
  }
});

test("listVideoAnalysisRecordsByVideoId valida videoId", async () => {
  await assert.rejects(
    () => listVideoAnalysisRecordsByVideoId("bad-id"),
    (error) =>
      error instanceof VideoAnalysisRecordServiceError &&
      error.code === "invalid_video_id",
  );
});
