require("ts-node/register/transpile-only");

const test = require("node:test");
const assert = require("node:assert/strict");

const Video = require("../src/models/Video").default;
const s3FilesService = require("../src/services/s3FilesService");
const { getLibraryVideosPaginated } = require("../src/services/videoService");

test("getLibraryVideosPaginated sin searchTerm mantiene listado y paginacion", async () => {
  const originalAggregate = Video.aggregate;
  const originalSigner = s3FilesService.getObjectS3SignedUrl;
  let pipelineRef = null;

  Video.aggregate = async (pipeline) => {
    pipelineRef = pipeline;
    return [
      {
        items: [{ _id: "67ed8f71cf3e27c5fe0ce245", s3Key: "video-a.mp4", uploadedAt: new Date() }],
        totalCount: [{ count: 1 }],
      },
    ];
  };
  s3FilesService.getObjectS3SignedUrl = (key) => `signed://${key}`;

  try {
    const result = await getLibraryVideosPaginated(1, 20);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].videoUrl, "signed://video-a.mp4");
    assert.equal(result.pagination.total, 1);
    assert.equal(result.pagination.totalPages, 1);
    assert.ok(pipelineRef);
    assert.deepEqual(pipelineRef[0], { $match: { s3Key: { $exists: true, $ne: "" } } });
  } finally {
    Video.aggregate = originalAggregate;
    s3FilesService.getObjectS3SignedUrl = originalSigner;
  }
});

test("getLibraryVideosPaginated con searchTerm filtra por s3Key/_id escapando regex", async () => {
  const originalAggregate = Video.aggregate;
  let pipelineRef = null;

  Video.aggregate = async (pipeline) => {
    pipelineRef = pipeline;
    return [{ items: [], totalCount: [{ count: 0 }] }];
  };

  try {
    await getLibraryVideosPaginated(1, 20, "  test(1)  ");
    const matchStage = pipelineRef[0].$match;
    const regexFromS3Key = matchStage.$and[1].$or[0].s3Key.$regex;
    const regexFromId = matchStage.$and[1].$or[1].$expr.$regexMatch.regex;

    assert.equal(regexFromS3Key, "test\\(1\\)");
    assert.equal(regexFromId, "test\\(1\\)");
  } finally {
    Video.aggregate = originalAggregate;
  }
});

test("getLibraryVideosPaginated calcula paginacion sobre total filtrado", async () => {
  const originalAggregate = Video.aggregate;

  Video.aggregate = async () => [
    {
      items: [
        { _id: "1", s3Key: "foo-1.mp4", uploadedAt: new Date() },
        { _id: "2", s3Key: "foo-2.mp4", uploadedAt: new Date() },
      ],
      totalCount: [{ count: 45 }],
    },
  ];

  try {
    const result = await getLibraryVideosPaginated(2, 20, "foo");
    assert.equal(result.pagination.page, 2);
    assert.equal(result.pagination.limit, 20);
    assert.equal(result.pagination.total, 45);
    assert.equal(result.pagination.totalPages, 3);
    assert.equal(result.pagination.hasNextPage, true);
    assert.equal(result.pagination.hasPrevPage, true);
  } finally {
    Video.aggregate = originalAggregate;
  }
});

test("getLibraryVideosPaginated con sportType aplica filtro por deporte", async () => {
  const originalAggregate = Video.aggregate;
  let pipelineRef = null;

  Video.aggregate = async (pipeline) => {
    pipelineRef = pipeline;
    return [{ items: [], totalCount: [{ count: 0 }] }];
  };

  try {
    await getLibraryVideosPaginated(1, 20, undefined, "football");
    assert.ok(pipelineRef);
    assert.deepEqual(pipelineRef[0], {
      $match: { s3Key: { $exists: true, $ne: "" }, sportType: "football" },
    });
  } finally {
    Video.aggregate = originalAggregate;
  }
});
