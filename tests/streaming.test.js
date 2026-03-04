require("ts-node/register/transpile-only");

const test = require("node:test");
const assert = require("node:assert/strict");

const MatchSession = require("../src/models/MatchSession").default;
const StreamRoom = require("../src/models/StreamRoom").default;
const RoomParticipant = require("../src/models/RoomParticipant").default;
const VideoSegment = require("../src/models/VideoSegment").default;
const s3FilesService = require("../src/services/s3FilesService");
const { roomEventsBus } = require("../src/services/roomEventsService");
const {
  createMatchSession,
  createRoomForSession,
  createSegment,
  StreamingServiceError,
} = require("../src/services/streamingService");

const ownerId = "67d123abc4567890def12345";
const sessionId = "67d123abc4567890def12346";
const roomId = "67d123abc4567890def12347";

test("createMatchSession crea sesion con owner y estado active", async () => {
  const originalCreate = MatchSession.create;

  MatchSession.create = async (payload) => ({
    _id: sessionId,
    ...payload,
    toObject: () => ({ _id: sessionId, ...payload }),
  });

  try {
    const result = await createMatchSession(ownerId, "Partido 1");
    assert.equal(result.title, "Partido 1");
    assert.equal(result.status, "active");
    assert.equal(String(result.ownerId), ownerId);
  } finally {
    MatchSession.create = originalCreate;
  }
});

test("createRoomForSession crea sala solo para owner", async () => {
  const originalFindById = MatchSession.findById;
  const originalRoomCreate = StreamRoom.create;
  const originalParticipantUpsert = RoomParticipant.findOneAndUpdate;

  MatchSession.findById = async () => ({ _id: sessionId, ownerId });
  StreamRoom.create = async (payload) => ({
    _id: roomId,
    ...payload,
    toObject: () => ({ _id: roomId, ...payload }),
  });
  RoomParticipant.findOneAndUpdate = async () => ({ _id: "p1" });

  try {
    const result = await createRoomForSession(sessionId, ownerId);
    assert.equal(String(result.matchSessionId), sessionId);
    assert.equal(String(result.ownerId), ownerId);
  } finally {
    MatchSession.findById = originalFindById;
    StreamRoom.create = originalRoomCreate;
    RoomParticipant.findOneAndUpdate = originalParticipantUpsert;
  }
});

test("createSegment es idempotente por (matchSessionId, sequence)", async () => {
  const originalSessionFind = MatchSession.findById;
  const originalRoomFind = StreamRoom.findById;
  const originalSegmentFindOne = VideoSegment.findOne;
  const originalSigned = s3FilesService.getObjectS3SignedUrl;

  MatchSession.findById = async () => ({ _id: sessionId, ownerId });
  StreamRoom.findById = async () => ({ _id: roomId, matchSessionId: sessionId });
  VideoSegment.findOne = async () => ({
    _id: "seg-1",
    matchSessionId: sessionId,
    roomId,
    sequence: 1,
    s3Key: "clip-1.mp4",
    toObject: () => ({
      _id: "seg-1",
      matchSessionId: sessionId,
      roomId,
      sequence: 1,
      s3Key: "clip-1.mp4",
    }),
  });
  s3FilesService.getObjectS3SignedUrl = () => "https://signed.example/clip-1.mp4";

  try {
    const result = await createSegment(sessionId, ownerId, {
      roomId,
      sequence: 1,
      durationSec: 20,
      startOffsetSec: 0,
      endOffsetSec: 20,
      s3Key: "clip-1.mp4",
      videoUrl: "https://bucket.s3.amazonaws.com/clip-1.mp4",
    });

    assert.equal(result.created, false);
    assert.equal(result.segment.sequence, 1);
    assert.equal(result.segment.signedDownloadUrl, "https://signed.example/clip-1.mp4");
  } finally {
    MatchSession.findById = originalSessionFind;
    StreamRoom.findById = originalRoomFind;
    VideoSegment.findOne = originalSegmentFindOne;
    s3FilesService.getObjectS3SignedUrl = originalSigned;
  }
});

test("roomEventsBus permite suscripcion y recepcion de eventos", () => {
  const received = [];
  const unsubscribe = roomEventsBus.subscribe(roomId, (event) => {
    received.push(event);
  });

  roomEventsBus.publish(roomId, {
    type: "segment_uploaded",
    roomId,
    sequence: 7,
  });

  unsubscribe();

  assert.equal(received.length, 1);
  assert.equal(received[0].type, "segment_uploaded");
  assert.equal(received[0].sequence, 7);
});

test("createSegment valida payload invalido", async () => {
  const originalSessionFind = MatchSession.findById;
  const originalRoomFind = StreamRoom.findById;

  MatchSession.findById = async () => ({ _id: sessionId, ownerId });
  StreamRoom.findById = async () => ({ _id: roomId, matchSessionId: sessionId });

  try {
    await assert.rejects(
      () =>
        createSegment(sessionId, ownerId, {
          roomId,
          sequence: -1,
          durationSec: 20,
          startOffsetSec: 0,
          endOffsetSec: 20,
          s3Key: "clip-1.mp4",
          videoUrl: "https://bucket.s3.amazonaws.com/clip-1.mp4",
        }),
      (error) =>
        error instanceof StreamingServiceError &&
        error.code === "invalid_segment_payload",
    );
  } finally {
    MatchSession.findById = originalSessionFind;
    StreamRoom.findById = originalRoomFind;
  }
});
