require("ts-node/register/transpile-only");

const test = require("node:test");
const assert = require("node:assert/strict");

const VideoStats = require("../src/models/VideoStats").default;
const Video = require("../src/models/Video").default;
const {
  calculateStatsFromEvents,
  createVideoStats,
  updateVideoStats,
  VideoStatsServiceError,
} = require("../src/services/videoStatsService");

const validVideoId = "67d123abc4567890def12345";

test("calculateStatsFromEvents aplica regla goal => shot", () => {
  const result = calculateStatsFromEvents([
    { id: "1", time: 10, type: "pass", team: "A" },
    { id: "2", time: 11, type: "shot", team: "B" },
    { id: "3", time: 12, type: "goal", team: "A" },
    { id: "4", time: 13, type: "foul", team: "B" },
    { id: "5", time: 14, type: "other", team: "A" },
  ]);

  assert.deepEqual(result, {
    passes: { total: 1, teamA: 1, teamB: 0 },
    shots: { total: 2, teamA: 1, teamB: 1 },
    goals: { total: 1, teamA: 1, teamB: 0 },
    fouls: { total: 1, teamA: 0, teamB: 1 },
    others: { total: 1, teamA: 1, teamB: 0 },
  });
});

test("createVideoStats (manual payload) recalcula stats y estructura retrocompatible", async () => {
  const originalVideoExists = Video.exists;
  const originalVideoUpdate = Video.findByIdAndUpdate;
  const originalFindOneAndUpdate = VideoStats.findOneAndUpdate;

  Video.exists = async () => true;
  Video.findByIdAndUpdate = async () => null;
  VideoStats.findOneAndUpdate = async (_query, updateDoc) => ({
    toObject: () => ({
      ...updateDoc,
      _id: "stats-1",
      createdAt: "2026-02-28T00:00:00.000Z",
      updatedAt: "2026-02-28T00:00:00.000Z",
    }),
  });

  try {
    const result = await createVideoStats({
      videoId: validVideoId,
      sportType: "football",
      teamAName: "Team A",
      teamBName: "Team B",
      events: [
        { id: "1", time: 10, type: "pass", team: "A" },
        { id: "2", time: 11, type: "shot", team: "B" },
        { id: "3", time: 12, type: "goal", team: "A" },
      ],
      manualStats: {
        passes: { total: 999, teamA: 999, teamB: 999 },
      },
      generatedByModel: "manual",
    });

    assert.equal(result.sportType, "football");
    assert.equal(result.teams[0].teamName, "Team A");
    assert.equal(result.matchStats.shots.total, 2);
    assert.equal(result.statistics.sportType, "football");
    assert.equal(result.statistics.matchStats.goals.teamA, 1);
  } finally {
    Video.exists = originalVideoExists;
    Video.findByIdAndUpdate = originalVideoUpdate;
    VideoStats.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("updateVideoStats soporta payload legacy (statistics.*)", async () => {
  const originalVideoExists = Video.exists;
  const originalVideoUpdate = Video.findByIdAndUpdate;
  const originalFindOneAndUpdate = VideoStats.findOneAndUpdate;

  Video.exists = async () => true;
  Video.findByIdAndUpdate = async () => null;
  VideoStats.findOneAndUpdate = async (_query, updateDoc) => ({
    toObject: () => ({
      ...updateDoc,
      _id: "stats-legacy",
      createdAt: "2026-02-28T00:00:00.000Z",
      updatedAt: "2026-02-28T00:05:00.000Z",
    }),
  });

  try {
    const result = await updateVideoStats(validVideoId, {
      generatedByModel: "Gemini-2.0-Flash",
      statistics: {
        sportType: "tennis",
        teams: [
          { teamName: "Player A", stats: { aces: 4, shots: 20 } },
          { teamName: "Player B", stats: { aces: 2, shots: 17 } },
        ],
        summary: "Partido equilibrado",
      },
    });

    assert.equal(result.sportType, "tennis");
    assert.equal(result.teams.length, 2);
    assert.equal(result.statistics.summary, "Partido equilibrado");
    assert.equal(result.matchStats.shots.total, 37);
  } finally {
    Video.exists = originalVideoExists;
    Video.findByIdAndUpdate = originalVideoUpdate;
    VideoStats.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("createVideoStats valida events y retorna error de dominio", async () => {
  const originalVideoExists = Video.exists;
  Video.exists = async () => true;
  try {
    await assert.rejects(
      () =>
        createVideoStats({
          videoId: validVideoId,
          sportType: "football",
          teamAName: "A",
          teamBName: "B",
          events: [{ id: "1", time: -1, type: "pass", team: "A" }],
        }),
      (error) => error instanceof VideoStatsServiceError && error.code === "invalid_event_time",
    );
  } finally {
    Video.exists = originalVideoExists;
  }
});
