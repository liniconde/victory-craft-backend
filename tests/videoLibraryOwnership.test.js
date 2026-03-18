require("ts-node/register/transpile-only");

const test = require("node:test");
const assert = require("node:assert/strict");

const Video = require("../src/models/Video").default;
const { getMyLibraryVideosPaginated, VideoServiceError } = require("../src/services/videoService");

test("getMyLibraryVideosPaginated filtra por ownerUserId y expone ownership", async () => {
  const originalAggregate = Video.aggregate;
  let pipelineRef = null;

  Video.aggregate = async (pipeline) => {
    pipelineRef = pipeline;
    return [
      {
        items: [
          {
            _id: "67ed8f71cf3e27c5fe0ce245",
            s3Key: "mine.mp4",
            uploadedAt: "2026-03-18T10:00:00.000Z",
            sportType: "football",
            ownerUserId: "67ed8f71cf3e27c5fe0ce246",
          },
        ],
        totalCount: [{ count: 1 }],
      },
    ];
  };

  try {
    const result = await getMyLibraryVideosPaginated(1, 20, undefined, "football", "67ed8f71cf3e27c5fe0ce246");
    assert.equal(String(pipelineRef[0].$match.ownerUserId), "67ed8f71cf3e27c5fe0ce246");
    assert.equal(result.items[0].ownerUserId, "67ed8f71cf3e27c5fe0ce246");
    assert.equal(result.items[0].sportType, "football");
  } finally {
    Video.aggregate = originalAggregate;
  }
});

test("getMyLibraryVideosPaginated requiere autenticacion", async () => {
  await assert.rejects(
    () => getMyLibraryVideosPaginated(1, 20),
    (error) =>
      error instanceof VideoServiceError &&
      error.code === "unauthorized" &&
      error.status === 401,
  );
});
