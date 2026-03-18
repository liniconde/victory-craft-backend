require("ts-node/register/transpile-only");

const test = require("node:test");
const assert = require("node:assert/strict");

const PlayerProfile = require("../src/models/PlayerProfile").default;
const PlayerProfileVideoLink = require("../src/models/PlayerProfileVideoLink").default;
const User = require("../src/models/User").default;
const Video = require("../src/models/Video").default;
const VideoScoutingProfile = require("../src/models/VideoScoutingProfile").default;
const {
  PlayerProfileServiceError,
  createPlayerProfile,
  getMyPlayerProfile,
  getPlayerProfileById,
  linkVideoToPlayerProfile,
  listPlayerProfiles,
  updatePlayerProfile,
} = require("../src/services/playerProfileService");

const authUserId = "67ed8f71cf3e27c5fe0ce245";
const otherUserId = "67ed8f71cf3e27c5fe0ce246";
const adminUserId = "67ed8f71cf3e27c5fe0ce247";
const profileId = "67ed8f71cf3e27c5fe0ce248";
const videoId = "67ed8f71cf3e27c5fe0ce249";

test("usuario normal puede obtener /me y ver su propio player profile", async () => {
  const originalFindOne = PlayerProfile.findOne;
  const originalFindById = PlayerProfile.findById;
  const ownProfile = {
    _id: profileId,
    userId: authUserId,
    email: "player@example.com",
    fullName: "Player Example",
    status: "active",
    createdAt: "2026-03-18T10:00:00.000Z",
    updatedAt: "2026-03-18T10:00:00.000Z",
  };

  PlayerProfile.findOne = () => ({
    lean: async () => ownProfile,
  });
  PlayerProfile.findById = () => ({
    lean: async () => ownProfile,
  });

  try {
    const mine = await getMyPlayerProfile({ id: authUserId, role: "user", email: "player@example.com" });
    const detail = await getPlayerProfileById(profileId, { id: authUserId, role: "user" });
    assert.equal(mine._id, profileId);
    assert.equal(detail._id, profileId);
  } finally {
    PlayerProfile.findOne = originalFindOne;
    PlayerProfile.findById = originalFindById;
  }
});

test("usuario normal no puede editar perfiles ajenos", async () => {
  const originalFindById = PlayerProfile.findById;

  PlayerProfile.findById = () => ({
    lean: async () => ({
      _id: profileId,
      userId: otherUserId,
      fullName: "Other Player",
      status: "active",
    }),
  });

  try {
    await assert.rejects(
      () => updatePlayerProfile(profileId, { fullName: "Changed" }, { id: authUserId, role: "user" }),
      (error) =>
        error instanceof PlayerProfileServiceError &&
        error.code === "forbidden" &&
        error.status === 403,
    );
  } finally {
    PlayerProfile.findById = originalFindById;
  }
});

test("usuario normal no puede asociar videos ajenos a su player profile", async () => {
  const originalFindById = PlayerProfile.findById;
  const originalFindOne = Video.findOne;

  PlayerProfile.findById = () => ({
    lean: async () => ({
      _id: profileId,
      userId: authUserId,
      fullName: "Own Player",
      status: "active",
    }),
  });
  Video.findOne = () => ({
    lean: async () => ({
      _id: videoId,
      videoType: "library",
      s3Key: "other-video.mp4",
      uploadedAt: "2026-03-18T10:00:00.000Z",
      ownerUserId: otherUserId,
    }),
  });

  try {
    await assert.rejects(
      () => linkVideoToPlayerProfile(profileId, { videoId }, { id: authUserId, role: "user" }),
      (error) =>
        error instanceof PlayerProfileServiceError &&
        error.code === "forbidden" &&
        error.status === 403,
    );
  } finally {
    PlayerProfile.findById = originalFindById;
    Video.findOne = originalFindOne;
  }
});

test("admin puede crear player profiles para terceros usando userId o email", async () => {
  const originalFindById = User.findById;
  const originalCreate = PlayerProfile.create;

  User.findById = () => ({
    select() {
      return this;
    },
    lean: async () => ({
      _id: otherUserId,
      email: "third@example.com",
    }),
  });
  PlayerProfile.create = async (payload) => ({
    toObject: () => ({
      _id: profileId,
      ...payload,
      createdAt: "2026-03-18T10:00:00.000Z",
      updatedAt: "2026-03-18T10:00:00.000Z",
    }),
  });

  try {
    const result = await createPlayerProfile(
      {
        userId: otherUserId,
        fullName: "Third Player",
        sportType: "football",
      },
      { id: adminUserId, role: "admin", email: "admin@example.com" },
    );
    assert.equal(String(result.userId), otherUserId);
    assert.equal(result.email, "third@example.com");
  } finally {
    User.findById = originalFindById;
    PlayerProfile.create = originalCreate;
  }
});

test("admin o recruiter puede buscar player profiles con filtros y paginacion", async () => {
  const originalAggregate = PlayerProfile.aggregate;
  let pipelineRef = null;

  PlayerProfile.aggregate = async (pipeline) => {
    pipelineRef = pipeline;
    return [
      {
        items: [
          {
            _id: profileId,
            userId: otherUserId,
            email: "alex@example.com",
            fullName: "Alex Forward",
            sportType: "football",
            team: "Blue FC",
            primaryPosition: "FW",
            category: "U19",
            country: "Spain",
            city: "Madrid",
            status: "active",
            userName: "alexfwd",
          },
        ],
        totalCount: [{ count: 1 }],
      },
    ];
  };

  try {
    const result = await listPlayerProfiles(
      {
        page: 2,
        limit: 5,
        email: "alex@example.com",
        fullName: "Alex",
        team: "Blue",
        sportType: "football",
      },
      { id: adminUserId, role: "recruiter" },
    );

    assert.equal(result.pagination.page, 2);
    assert.equal(result.pagination.limit, 5);
    assert.equal(result.items[0].fullName, "Alex Forward");
    assert.deepEqual(pipelineRef[0], {
      $match: {
        email: { $regex: "alex@example\\.com", $options: "i" },
        team: { $regex: "Blue", $options: "i" },
        sportType: "football",
      },
    });
    assert.equal(pipelineRef[3].$match.$or[0].fullName.$regex, "Alex");
  } finally {
    PlayerProfile.aggregate = originalAggregate;
  }
});

test("la asociacion video-perfil valida existencia de ambos recursos", async () => {
  const originalFindById = PlayerProfile.findById;
  const originalFindOne = Video.findOne;

  PlayerProfile.findById = () => ({
    lean: async () => null,
  });

  try {
    await assert.rejects(
      () => linkVideoToPlayerProfile(profileId, { videoId }, { id: adminUserId, role: "admin" }),
      (error) =>
        error instanceof PlayerProfileServiceError &&
        error.code === "player_profile_not_found" &&
        error.status === 404,
    );
  } finally {
    PlayerProfile.findById = originalFindById;
  }

  PlayerProfile.findById = () => ({
    lean: async () => ({
      _id: profileId,
      userId: otherUserId,
      fullName: "Third Player",
      status: "active",
    }),
  });
  Video.findOne = () => ({
    lean: async () => null,
  });

  try {
    await assert.rejects(
      () => linkVideoToPlayerProfile(profileId, { videoId }, { id: adminUserId, role: "admin" }),
      (error) =>
        error instanceof PlayerProfileServiceError &&
        error.code === "video_not_found" &&
        error.status === 404,
    );
  } finally {
    PlayerProfile.findById = originalFindById;
    Video.findOne = originalFindOne;
  }
});
