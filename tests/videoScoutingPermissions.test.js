require("ts-node/register/transpile-only");

const test = require("node:test");
const assert = require("node:assert/strict");

const Video = require("../src/models/Video").default;
const PlayerProfile = require("../src/models/PlayerProfile").default;
const PlayerProfileVideoLink = require("../src/models/PlayerProfileVideoLink").default;
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
const playerProfileId = "67ed8f71cf3e27c5fe0ce248";

const makeLibraryVideo = () => ({
  _id: videoId,
  videoType: "library",
  s3Key: "prospect.mp4",
  sportType: "football",
  uploadedAt: "2026-03-18T10:00:00.000Z",
  ownerUserId: userId,
});

const makePlayerProfile = () => ({
  _id: playerProfileId,
  userId,
  fullName: "Juan Perez",
  primaryPosition: "RW",
  team: "CD Norte",
  category: "U17",
  dominantProfile: "right-footed",
  country: "Spain",
  city: "Madrid",
});

const makeCreatePayload = () => ({
  playerProfileId,
  title: "Winger highlights",
  sportType: "football",
  playType: "attacking_transition",
  tournamentType: "league",
  tournamentName: "Madrid Youth League",
  recordedAt: "2026-03-15T10:00:00.000Z",
  playerAge: 17,
  jerseyNumber: 11,
  notes: "Strong 1v1 profile",
  tags: ["speed", "duels"],
});

test("createVideoScoutingProfile permite role=user para la POC", async () => {
  const originalFindOne = Video.findOne;
  const originalProfileFindOne = VideoScoutingProfile.findOne;
  const originalCreate = VideoScoutingProfile.create;
  const originalPlayerProfileFindById = PlayerProfile.findById;
  const originalPlayerProfileVideoLinkFindOne = PlayerProfileVideoLink.findOne;

  Video.findOne = () => ({
    lean: async () => makeLibraryVideo(),
  });
  VideoScoutingProfile.findOne = () => ({
    lean: async () => null,
  });
  PlayerProfileVideoLink.findOne = () => ({
    select() {
      return this;
    },
    lean: async () => ({ _id: "67ed8f71cf3e27c5fe0ce251", playerProfileId, videoId }),
  });
  PlayerProfile.findById = () => ({
    select() {
      return this;
    },
    lean: async () => makePlayerProfile(),
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
      makeCreatePayload(),
      { id: userId, role: "user" },
    );
    assert.equal(result.scoutingProfile.title, "Winger highlights");
    assert.equal(result.scoutingProfile.publicationStatus, "published");
  } finally {
    Video.findOne = originalFindOne;
    VideoScoutingProfile.findOne = originalProfileFindOne;
    VideoScoutingProfile.create = originalCreate;
    PlayerProfile.findById = originalPlayerProfileFindById;
    PlayerProfileVideoLink.findOne = originalPlayerProfileVideoLinkFindOne;
  }
});

test("updateVideoScoutingProfile permite role=user para la POC", async () => {
  const originalFindOne = Video.findOne;
  const originalProfileFindOne = VideoScoutingProfile.findOne;
  const originalFindOneAndUpdate = VideoScoutingProfile.findOneAndUpdate;
  const originalPlayerProfileFindById = PlayerProfile.findById;
  const originalPlayerProfileVideoLinkFindOne = PlayerProfileVideoLink.findOne;

  Video.findOne = () => ({
    lean: async () => makeLibraryVideo(),
  });
  VideoScoutingProfile.findOne = () => ({
    lean: async () => ({
      _id: "67ed8f71cf3e27c5fe0ce248",
      videoId,
      playerProfileId,
      publicationStatus: "published",
      ...makeCreatePayload(),
    }),
  });
  PlayerProfileVideoLink.findOne = () => ({
    select() {
      return this;
    },
    lean: async () => ({ _id: "67ed8f71cf3e27c5fe0ce251", playerProfileId, videoId }),
  });
  PlayerProfile.findById = () => ({
    select() {
      return this;
    },
    lean: async () => makePlayerProfile(),
  });
  VideoScoutingProfile.findOneAndUpdate = () => ({
    lean: async () => ({
      _id: "67ed8f71cf3e27c5fe0ce248",
      videoId,
      title: "Updated title",
      playerProfileId,
      publicationStatus: "published",
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
    VideoScoutingProfile.findOne = originalProfileFindOne;
    VideoScoutingProfile.findOneAndUpdate = originalFindOneAndUpdate;
    PlayerProfile.findById = originalPlayerProfileFindById;
    PlayerProfileVideoLink.findOne = originalPlayerProfileVideoLinkFindOne;
  }
});

test("createVideoScoutingProfile hidrata datos del jugador desde playerProfileId", async () => {
  const originalFindOne = Video.findOne;
  const originalProfileFindOne = VideoScoutingProfile.findOne;
  const originalCreate = VideoScoutingProfile.create;
  const originalPlayerProfileFindById = PlayerProfile.findById;
  const originalPlayerProfileVideoLinkFindOne = PlayerProfileVideoLink.findOne;

  let createdPayload = null;

  Video.findOne = () => ({
    lean: async () => makeLibraryVideo(),
  });
  VideoScoutingProfile.findOne = () => ({
    lean: async () => null,
  });
  PlayerProfileVideoLink.findOne = () => ({
    select() {
      return this;
    },
    lean: async () => ({ _id: "67ed8f71cf3e27c5fe0ce251", playerProfileId, videoId }),
  });
  PlayerProfile.findById = () => ({
    select() {
      return this;
    },
    lean: async () => makePlayerProfile(),
  });
  VideoScoutingProfile.create = async (payload) => {
    createdPayload = payload;
    return {
      toObject: () => ({
        _id: "67ed8f71cf3e27c5fe0ce249",
        ...payload,
        createdAt: "2026-03-18T10:05:00.000Z",
        updatedAt: "2026-03-18T10:05:00.000Z",
      }),
    };
  };

  try {
    const result = await createVideoScoutingProfile(
      videoId,
      makeCreatePayload(),
      { id: userId, role: "user" },
    );

    assert.equal(result.scoutingProfile.playerProfileId, playerProfileId);
    assert.equal(createdPayload.playerName, "Juan Perez");
    assert.equal(createdPayload.playerPosition, "RW");
    assert.equal(createdPayload.playerTeam, "CD Norte");
    assert.equal(createdPayload.playerCategory, "U17");
    assert.equal(createdPayload.dominantProfile, "right-footed");
    assert.equal(createdPayload.country, "Spain");
    assert.equal(createdPayload.city, "Madrid");
  } finally {
    Video.findOne = originalFindOne;
    VideoScoutingProfile.findOne = originalProfileFindOne;
    VideoScoutingProfile.create = originalCreate;
    PlayerProfile.findById = originalPlayerProfileFindById;
    PlayerProfileVideoLink.findOne = originalPlayerProfileVideoLinkFindOne;
  }
});

test("updateVideoScoutingProfile hidrata datos del jugador desde playerProfileId", async () => {
  const originalFindOne = Video.findOne;
  const originalProfileFindOne = VideoScoutingProfile.findOne;
  const originalFindOneAndUpdate = VideoScoutingProfile.findOneAndUpdate;
  const originalPlayerProfileFindById = PlayerProfile.findById;
  const originalPlayerProfileVideoLinkFindOne = PlayerProfileVideoLink.findOne;

  let updatePayload = null;

  Video.findOne = () => ({
    lean: async () => makeLibraryVideo(),
  });
  VideoScoutingProfile.findOne = () => ({
    lean: async () => ({
      _id: "67ed8f71cf3e27c5fe0ce249",
      videoId,
      playerProfileId,
      publicationStatus: "published",
      ...makeCreatePayload(),
    }),
  });
  PlayerProfileVideoLink.findOne = () => ({
    select() {
      return this;
    },
    lean: async () => ({ _id: "67ed8f71cf3e27c5fe0ce251", playerProfileId, videoId }),
  });
  PlayerProfile.findById = () => ({
    select() {
      return this;
    },
    lean: async () => makePlayerProfile(),
  });
  VideoScoutingProfile.findOneAndUpdate = (_filter, update) => {
    updatePayload = update.$set;
    return {
      lean: async () => ({
        _id: "67ed8f71cf3e27c5fe0ce249",
        videoId,
        ...update.$set,
        updatedAt: "2026-03-18T11:00:00.000Z",
      }),
    };
  };

  try {
    const result = await updateVideoScoutingProfile(
      videoId,
      {
        playerProfileId,
        title: "Updated title",
      },
      { id: userId, role: "user" },
    );
    assert.equal(result.scoutingProfile.playerName, "Juan Perez");
    assert.equal(updatePayload.playerPosition, "RW");
    assert.equal(updatePayload.playerTeam, "CD Norte");
    assert.equal(updatePayload.country, "Spain");
  } finally {
    Video.findOne = originalFindOne;
    VideoScoutingProfile.findOne = originalProfileFindOne;
    VideoScoutingProfile.findOneAndUpdate = originalFindOneAndUpdate;
    PlayerProfile.findById = originalPlayerProfileFindById;
    PlayerProfileVideoLink.findOne = originalPlayerProfileVideoLinkFindOne;
  }
});

test("updateVideoScoutingProfile permite archivar un video para quitarlo del ranking sin borrar metadata", async () => {
  const originalFindOne = Video.findOne;
  const originalProfileFindOne = VideoScoutingProfile.findOne;
  const originalFindOneAndUpdate = VideoScoutingProfile.findOneAndUpdate;
  const originalPlayerProfileFindById = PlayerProfile.findById;
  const originalPlayerProfileVideoLinkFindOne = PlayerProfileVideoLink.findOne;

  let updatePayload = null;

  Video.findOne = () => ({
    lean: async () => makeLibraryVideo(),
  });
  VideoScoutingProfile.findOne = () => ({
    lean: async () => ({
      _id: "67ed8f71cf3e27c5fe0ce249",
      videoId,
      playerProfileId,
      publicationStatus: "published",
      ...makeCreatePayload(),
    }),
  });
  PlayerProfileVideoLink.findOne = () => ({
    select() {
      return this;
    },
    lean: async () => ({ _id: "67ed8f71cf3e27c5fe0ce251", playerProfileId, videoId }),
  });
  PlayerProfile.findById = () => ({
    select() {
      return this;
    },
    lean: async () => makePlayerProfile(),
  });
  VideoScoutingProfile.findOneAndUpdate = (_filter, update) => {
    updatePayload = update.$set;
    return {
      lean: async () => ({
        _id: "67ed8f71cf3e27c5fe0ce249",
        videoId,
        title: "Updated title",
        publicationStatus: "archived",
        ...update.$set,
        updatedAt: "2026-03-18T11:00:00.000Z",
      }),
    };
  };

  try {
    const result = await updateVideoScoutingProfile(
      videoId,
      { publicationStatus: "archived" },
      { id: userId, role: "user" },
    );
    assert.equal(updatePayload.publicationStatus, "archived");
    assert.equal(result.scoutingProfile.publicationStatus, "archived");
  } finally {
    Video.findOne = originalFindOne;
    VideoScoutingProfile.findOne = originalProfileFindOne;
    VideoScoutingProfile.findOneAndUpdate = originalFindOneAndUpdate;
    PlayerProfile.findById = originalPlayerProfileFindById;
    PlayerProfileVideoLink.findOne = originalPlayerProfileVideoLinkFindOne;
  }
});

test("createVideoScoutingProfile falla si playerProfileId no existe", async () => {
  const originalFindOne = Video.findOne;
  const originalProfileFindOne = VideoScoutingProfile.findOne;
  const originalPlayerProfileFindById = PlayerProfile.findById;
  const originalPlayerProfileVideoLinkFindOne = PlayerProfileVideoLink.findOne;

  Video.findOne = () => ({
    lean: async () => makeLibraryVideo(),
  });
  VideoScoutingProfile.findOne = () => ({
    lean: async () => null,
  });
  PlayerProfileVideoLink.findOne = () => ({
    select() {
      return this;
    },
    lean: async () => ({ _id: "67ed8f71cf3e27c5fe0ce251", playerProfileId, videoId }),
  });
  PlayerProfile.findById = () => ({
    select() {
      return this;
    },
    lean: async () => null,
  });

  try {
    await assert.rejects(
      () =>
        createVideoScoutingProfile(
          videoId,
          {
            ...makeCreatePayload(),
          },
          { id: userId, role: "user" },
        ),
      (error) =>
        error instanceof VideoScoutingServiceError &&
        error.code === "player_profile_not_found" &&
        error.status === 404,
    );
  } finally {
    Video.findOne = originalFindOne;
    VideoScoutingProfile.findOne = originalProfileFindOne;
    PlayerProfile.findById = originalPlayerProfileFindById;
    PlayerProfileVideoLink.findOne = originalPlayerProfileVideoLinkFindOne;
  }
});

test("createVideoScoutingProfile falla si el video no esta vinculado al player profile", async () => {
  const originalFindOne = Video.findOne;
  const originalProfileFindOne = VideoScoutingProfile.findOne;
  const originalPlayerProfileVideoLinkFindOne = PlayerProfileVideoLink.findOne;

  Video.findOne = () => ({
    lean: async () => makeLibraryVideo(),
  });
  VideoScoutingProfile.findOne = () => ({
    lean: async () => null,
  });
  PlayerProfileVideoLink.findOne = () => ({
    select() {
      return this;
    },
    lean: async () => null,
  });

  try {
    await assert.rejects(
      () => createVideoScoutingProfile(videoId, makeCreatePayload(), { id: userId, role: "user" }),
      (error) =>
        error instanceof VideoScoutingServiceError &&
        error.code === "player_profile_video_not_linked" &&
        error.status === 409,
    );
  } finally {
    Video.findOne = originalFindOne;
    VideoScoutingProfile.findOne = originalProfileFindOne;
    PlayerProfileVideoLink.findOne = originalPlayerProfileVideoLinkFindOne;
  }
});

test("createVideoScoutingProfile falla si falta metadata minima para publicar", async () => {
  const originalFindOne = Video.findOne;
  const originalProfileFindOne = VideoScoutingProfile.findOne;
  const originalPlayerProfileFindById = PlayerProfile.findById;
  const originalPlayerProfileVideoLinkFindOne = PlayerProfileVideoLink.findOne;

  Video.findOne = () => ({
    lean: async () => makeLibraryVideo(),
  });
  VideoScoutingProfile.findOne = () => ({
    lean: async () => null,
  });
  PlayerProfileVideoLink.findOne = () => ({
    select() {
      return this;
    },
    lean: async () => ({ _id: "67ed8f71cf3e27c5fe0ce251", playerProfileId, videoId }),
  });
  PlayerProfile.findById = () => ({
    select() {
      return this;
    },
    lean: async () => makePlayerProfile(),
  });

  try {
    await assert.rejects(
      () =>
        createVideoScoutingProfile(
          videoId,
          {
            playerProfileId,
            title: "Winger highlights",
            sportType: "football",
            tournamentType: "league",
            tournamentName: "Madrid Youth League",
            recordedAt: "2026-03-15T10:00:00.000Z",
          },
          { id: userId, role: "user" },
        ),
      (error) =>
        error instanceof VideoScoutingServiceError &&
        error.code === "invalid_scouting_profile_payload" &&
        error.status === 400,
    );
  } finally {
    Video.findOne = originalFindOne;
    VideoScoutingProfile.findOne = originalProfileFindOne;
    PlayerProfile.findById = originalPlayerProfileFindById;
    PlayerProfileVideoLink.findOne = originalPlayerProfileVideoLinkFindOne;
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
