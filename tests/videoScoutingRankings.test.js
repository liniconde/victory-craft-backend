require("ts-node/register/transpile-only");

const test = require("node:test");
const assert = require("node:assert/strict");

const PlayerProfile = require("../src/models/PlayerProfile").default;
const PlayerProfileVideoLink = require("../src/models/PlayerProfileVideoLink").default;
const Video = require("../src/models/Video").default;
const VideoVote = require("../src/models/VideoVote").default;
const s3FilesService = require("../src/services/s3FilesService");
const { getVideoLibraryRankings } = require("../src/services/videoScoutingService");

const baseRecordedAt = "2026-03-10T00:00:00.000Z";

const makeRow = ({
  id,
  uploadedAt,
  upvotes = 0,
  downvotes = 0,
  scoutingProfile = { recordedAt: baseRecordedAt, title: "Prospect" },
}) => ({
  _id: id,
  s3Key: `${id}.mp4`,
  sportType: "football",
  uploadedAt,
  upvotes,
  downvotes,
  scoutingProfile: scoutingProfile
    ? {
        _id: `profile-${id}`,
        videoId: id,
        ...scoutingProfile,
      }
    : null,
});

const mockNoLinkedPlayerProfiles = () => {
  const originalPlayerProfileFind = PlayerProfile.find;
  const originalLinkFind = PlayerProfileVideoLink.find;

  PlayerProfileVideoLink.find = () => ({
    select() {
      return this;
    },
    lean: async () => [],
  });
  PlayerProfile.find = () => ({
    select() {
      return this;
    },
    lean: async () => [],
  });

  return () => {
    PlayerProfile.find = originalPlayerProfileFind;
    PlayerProfileVideoLink.find = originalLinkFind;
  };
};

test("getVideoLibraryRankings con sortBy=score ordena score desc y desempata por uploadedAt desc", async () => {
  const originalAggregate = Video.aggregate;
  const originalSigner = s3FilesService.getObjectS3SignedUrl;
  const restorePlayerProfiles = mockNoLinkedPlayerProfiles();

  Video.aggregate = async () => [
    makeRow({ id: "video-low", uploadedAt: "2026-03-01T00:00:00.000Z", upvotes: 1 }),
    makeRow({ id: "video-tie-old", uploadedAt: "2026-03-02T00:00:00.000Z", upvotes: 3 }),
    makeRow({ id: "video-top", uploadedAt: "2026-03-03T00:00:00.000Z", upvotes: 5 }),
    makeRow({ id: "video-tie-new", uploadedAt: "2026-03-05T00:00:00.000Z", upvotes: 3 }),
  ];
  s3FilesService.getObjectS3SignedUrl = (key) => `signed://${key}`;

  try {
    const result = await getVideoLibraryRankings({ sortBy: "score", page: 1, limit: 10 });
    assert.deepEqual(
      result.items.map((item) => item.video._id),
      ["video-top", "video-tie-new", "video-tie-old", "video-low"],
    );
    assert.ok(result.items[1].ranking.score === result.items[2].ranking.score);
  } finally {
    Video.aggregate = originalAggregate;
    s3FilesService.getObjectS3SignedUrl = originalSigner;
    restorePlayerProfiles();
  }
});

test("getVideoLibraryRankings pagina despues de aplicar un orden estable", async () => {
  const originalAggregate = Video.aggregate;
  const restorePlayerProfiles = mockNoLinkedPlayerProfiles();

  Video.aggregate = async () => [
    makeRow({ id: "video-c", uploadedAt: "2026-03-03T00:00:00.000Z", upvotes: 2 }),
    makeRow({ id: "video-a", uploadedAt: "2026-03-01T00:00:00.000Z", upvotes: 4 }),
    makeRow({ id: "video-d", uploadedAt: "2026-03-04T00:00:00.000Z", upvotes: 1 }),
    makeRow({ id: "video-b", uploadedAt: "2026-03-02T00:00:00.000Z", upvotes: 3 }),
  ];

  try {
    const page1 = await getVideoLibraryRankings({ sortBy: "score", page: 1, limit: 2 });
    const page2 = await getVideoLibraryRankings({ sortBy: "score", page: 2, limit: 2 });

    assert.deepEqual(page1.items.map((item) => item.video._id), ["video-a", "video-b"]);
    assert.deepEqual(page2.items.map((item) => item.video._id), ["video-c", "video-d"]);
    assert.equal(page1.pagination.total, 4);
    assert.equal(page2.pagination.hasPrevPage, true);
  } finally {
    Video.aggregate = originalAggregate;
    restorePlayerProfiles();
  }
});

test("getVideoLibraryRankings con sortBy=recent mantiene orden por uploadedAt desc", async () => {
  const originalAggregate = Video.aggregate;
  const restorePlayerProfiles = mockNoLinkedPlayerProfiles();

  Video.aggregate = async () => [
    makeRow({ id: "video-old", uploadedAt: "2026-03-01T00:00:00.000Z", upvotes: 100 }),
    makeRow({ id: "video-new", uploadedAt: "2026-03-03T00:00:00.000Z", upvotes: 1 }),
    makeRow({ id: "video-mid", uploadedAt: "2026-03-02T00:00:00.000Z", upvotes: 50 }),
  ];

  try {
    const result = await getVideoLibraryRankings({ sortBy: "recent", page: 1, limit: 10 });
    assert.deepEqual(
      result.items.map((item) => item.video._id),
      ["video-new", "video-mid", "video-old"],
    );
  } finally {
    Video.aggregate = originalAggregate;
    restorePlayerProfiles();
  }
});

test("getVideoLibraryRankings con sortBy=upvotes mantiene upvotes desc y desempata por uploadedAt desc", async () => {
  const originalAggregate = Video.aggregate;
  const restorePlayerProfiles = mockNoLinkedPlayerProfiles();

  Video.aggregate = async () => [
    makeRow({ id: "video-top", uploadedAt: "2026-03-01T00:00:00.000Z", upvotes: 5 }),
    makeRow({ id: "video-tie-old", uploadedAt: "2026-03-02T00:00:00.000Z", upvotes: 3 }),
    makeRow({ id: "video-low", uploadedAt: "2026-03-05T00:00:00.000Z", upvotes: 1 }),
    makeRow({ id: "video-tie-new", uploadedAt: "2026-03-04T00:00:00.000Z", upvotes: 3 }),
  ];

  try {
    const result = await getVideoLibraryRankings({ sortBy: "upvotes", page: 1, limit: 10 });
    assert.deepEqual(
      result.items.map((item) => item.video._id),
      ["video-top", "video-tie-new", "video-tie-old", "video-low"],
    );
  } finally {
    Video.aggregate = originalAggregate;
    restorePlayerProfiles();
  }
});

test("getVideoLibraryRankings usa _id como desempate final para mantener orden deterministico", async () => {
  const originalAggregate = Video.aggregate;
  const originalFind = VideoVote.find;
  const restorePlayerProfiles = mockNoLinkedPlayerProfiles();
  const videoAId = "67ed8f71cf3e27c5fe0ce241";
  const videoBId = "67ed8f71cf3e27c5fe0ce242";

  Video.aggregate = async () => [
    makeRow({ id: videoAId, uploadedAt: "2026-03-05T00:00:00.000Z", upvotes: 2 }),
    makeRow({ id: videoBId, uploadedAt: "2026-03-05T00:00:00.000Z", upvotes: 2 }),
  ];
  VideoVote.find = () => ({
    select() {
      return this;
    },
    lean: async () => [],
  });

  try {
    const result = await getVideoLibraryRankings(
      { sortBy: "score", page: 1, limit: 10 },
      "67ed8f71cf3e27c5fe0ce245",
    );
    assert.deepEqual(
      result.items.map((item) => item.video._id),
      [videoBId, videoAId],
    );
  } finally {
    Video.aggregate = originalAggregate;
    VideoVote.find = originalFind;
    restorePlayerProfiles();
  }
});

test("getVideoLibraryRankings excluye scouting profiles archivados y videos sin scouting profile", async () => {
  const originalAggregate = Video.aggregate;
  const restorePlayerProfiles = mockNoLinkedPlayerProfiles();

  Video.aggregate = async () => [
    makeRow({ id: "video-published", uploadedAt: "2026-03-03T00:00:00.000Z", upvotes: 2 }),
    makeRow({
      id: "video-archived",
      uploadedAt: "2026-03-04T00:00:00.000Z",
      upvotes: 9,
      scoutingProfile: { recordedAt: baseRecordedAt, title: "Archived", publicationStatus: "archived" },
    }),
    makeRow({ id: "video-without-profile", uploadedAt: "2026-03-05T00:00:00.000Z", upvotes: 0, scoutingProfile: null }),
  ];

  try {
    const normal = await getVideoLibraryRankings({ sortBy: "score", page: 1, limit: 10 });

    assert.deepEqual(normal.items.map((item) => item.video._id), ["video-published"]);
  } finally {
    Video.aggregate = originalAggregate;
    restorePlayerProfiles();
  }
});
