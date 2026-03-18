require("ts-node/register/transpile-only");

const test = require("node:test");
const assert = require("node:assert/strict");

const Video = require("../src/models/Video").default;
const VideoScoutingProfile = require("../src/models/VideoScoutingProfile").default;
const {
  createVideoScoutingProfile,
  updateVideoScoutingProfile,
  deleteVideoVoteByUser,
  VideoScoutingServiceError,
} = require("../src/services/videoScoutingService");

const videoId = "67ed8f71cf3e27c5fe0ce245";
const userId = "67ed8f71cf3e27c5fe0ce246";
const otherUserId = "67ed8f71cf3e27c5fe0ce247";

test("createVideoScoutingProfile permite role=user para la POC", async () => {
  const originalFindOne = Video.findOne;
  const originalProfileFindOne = VideoScoutingProfile.findOne;
  const originalCreate = VideoScoutingProfile.create;

  Video.findOne = () => ({
    lean: async () => ({
      _id: videoId,
      videoType: "library",
      s3Key: "prospect.mp4",
      sportType: "football",
      uploadedAt: "2026-03-18T10:00:00.000Z",
    }),
  });
  VideoScoutingProfile.findOne = () => ({
    lean: async () => null,
  });
  VideoScoutingProfile.create = async (payload) => ({
    toObject: () => ({
      _id: "67ed8f71cf3e27c5fe0ce248",
      ...payload,
      createdAt: "2026-03-18T10:05:00.000Z",
      updatedAt: "2026-03-18T10:05:00.000Z",
    }),
  });

  try {
    const result = await createVideoScoutingProfile(
      videoId,
      { title: "Winger highlights" },
      { id: userId, role: "user" },
    );
    assert.equal(result.scoutingProfile.title, "Winger highlights");
  } finally {
    Video.findOne = originalFindOne;
    VideoScoutingProfile.findOne = originalProfileFindOne;
    VideoScoutingProfile.create = originalCreate;
  }
});

test("updateVideoScoutingProfile permite role=user para la POC", async () => {
  const originalFindOne = Video.findOne;
  const originalFindOneAndUpdate = VideoScoutingProfile.findOneAndUpdate;

  Video.findOne = () => ({
    lean: async () => ({
      _id: videoId,
      videoType: "library",
      s3Key: "prospect.mp4",
      sportType: "football",
      uploadedAt: "2026-03-18T10:00:00.000Z",
    }),
  });
  VideoScoutingProfile.findOneAndUpdate = () => ({
    lean: async () => ({
      _id: "67ed8f71cf3e27c5fe0ce248",
      videoId,
      title: "Updated title",
      updatedAt: "2026-03-18T11:00:00.000Z",
    }),
  });

  try {
    const result = await updateVideoScoutingProfile(
      videoId,
      { title: "Updated title" },
      { id: userId, role: "user" },
    );
    assert.equal(result.scoutingProfile.title, "Updated title");
  } finally {
    Video.findOne = originalFindOne;
    VideoScoutingProfile.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("deleteVideoVoteByUser mantiene restriccion para que user no borre votos ajenos", async () => {
  try {
    await assert.rejects(
      () =>
        deleteVideoVoteByUser(videoId, otherUserId, {
          id: userId,
          role: "user",
        }),
      (error) =>
        error instanceof VideoScoutingServiceError &&
        error.code === "forbidden" &&
        error.status === 403,
    );
  } catch (error) {
    throw error;
  }
});
