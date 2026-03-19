require("ts-node/register/transpile-only");

const test = require("node:test");
const assert = require("node:assert/strict");

const Video = require("../src/models/Video").default;
const {
  createLibraryVideo,
  VideoServiceError,
} = require("../src/services/videoService");
const {
  createScoutingProfileSchema,
} = require("../src/recruiters-ms/domain/videoScoutingContracts");
const {
  createPlayerProfileSchema,
} = require("../src/recruiters-ms/domain/playerProfileContracts");
const {
  getVideoLibraryFiltersCatalog,
} = require("../src/recruiters-ms/application/videoScoutingService");

test("createLibraryVideo normaliza sportType case-insensitive", async () => {
  const originalCreate = Video.create;

  let createdPayload = null;
  Video.create = async (payload) => {
    createdPayload = payload;
    return {
      ...payload,
      toObject() {
        return { _id: "video-1", uploadedAt: "2026-03-19T10:00:00.000Z", ...payload };
      },
    };
  };

  try {
    await createLibraryVideo({
      s3Key: "videos/library/test.mp4",
      sportType: "Football",
    });

    assert.equal(createdPayload.sportType, "football");
  } finally {
    Video.create = originalCreate;
  }
});

test("createLibraryVideo rechaza sportType fuera del catalogo oficial", async () => {
  await assert.rejects(
    () =>
      createLibraryVideo({
        s3Key: "videos/library/test.mp4",
        sportType: "handball",
      }),
    (error) =>
      error instanceof VideoServiceError &&
      error.code === "invalid_sport_type" &&
      error.status === 400,
  );
});

test("scouting profile normaliza sportType al catalogo oficial", async () => {
  const result = createScoutingProfileSchema.safeParse({
    playerProfileId: "67ed8f71cf3e27c5fe0ce248",
    title: "Gol",
    sportType: "Football",
    playType: "transition",
    tournamentType: "league",
    tournamentName: "Liga",
    recordedAt: "2026-03-19T10:00:00.000Z",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.sportType, "football");
});

test("player profile normaliza sportType al catalogo oficial", async () => {
  const result = createPlayerProfileSchema.safeParse({
    fullName: "Player One",
    sportType: "Basketball",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.sportType, "basketball");
});

test("filters catalog devuelve la lista oficial de sportTypes", async () => {
  const VideoScoutingProfile = require("../src/models/VideoScoutingProfile").default;
  const originalScoutingAggregate = VideoScoutingProfile.aggregate;

  let aggregateCall = 0;
  VideoScoutingProfile.aggregate = async () => {
    aggregateCall += 1;
    if (aggregateCall === 1) {
      return [
        {
          sportTypes: ["football"],
          playTypes: ["transition"],
          tournamentTypes: ["league"],
          countries: ["Spain"],
          cities: ["Madrid"],
          playerPositions: ["winger"],
          playerCategories: ["U19"],
          tournaments: ["Elite Cup"],
        },
      ];
    }
    return [{ tags: ["speed"] }];
  };

  try {
    const result = await getVideoLibraryFiltersCatalog();
    assert.deepEqual(result.sportTypes, [
      "football",
      "futsal",
      "basketball",
      "baseball",
      "volleyball",
      "tennis",
      "padel",
      "other",
    ]);
  } finally {
    VideoScoutingProfile.aggregate = originalScoutingAggregate;
  }
});
