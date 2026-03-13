import mongoose from "mongoose";
import MatchSession from "../models/MatchSession";
import StreamRoom from "../models/StreamRoom";
import RoomParticipant from "../models/RoomParticipant";
import VideoSegment from "../models/VideoSegment";
import { getObjectS3SignedUrl } from "./s3FilesService";
import { roomEventsBus } from "./roomEventsService";
import {
  CreateVideoSegmentDto,
  SegmentUploadedEvent,
  StreamClosedEvent,
} from "../contracts/streamingContracts";

export class StreamingServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const assertObjectId = (value: string, field: string) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    throw new StreamingServiceError(400, `invalid_${field}`, `${field} is invalid`);
  }
};

const ensureRoomAccess = async (roomId: string, userId: string) => {
  const room = await StreamRoom.findById(roomId);
  if (!room) throw new StreamingServiceError(404, "room_not_found", "Room not found");

  if (String(room.ownerId) === userId) return room;

  const participant = await RoomParticipant.findOne({ roomId, userId, status: "active" });
  if (!participant) throw new StreamingServiceError(403, "forbidden", "User is not part of room");
  return room;
};

const ensureMatchSessionAccess = async (matchSessionId: string, userId: string) => {
  const session = await MatchSession.findById(matchSessionId);
  if (!session) {
    throw new StreamingServiceError(404, "session_not_found", "Match session not found");
  }

  if (String(session.ownerId) === userId) return session;

  const rooms = await StreamRoom.find({ matchSessionId }, { _id: 1 }).lean();
  const roomIds = rooms.map((room) => room._id);
  if (!roomIds.length) {
    throw new StreamingServiceError(403, "forbidden", "User is not part of match session");
  }

  const participant = await RoomParticipant.findOne({
    roomId: { $in: roomIds },
    userId,
    status: "active",
  });

  if (!participant) {
    throw new StreamingServiceError(403, "forbidden", "User is not part of match session");
  }

  return session;
};

const getSessionMetrics = async (matchSessionId: string) => {
  const rows = await VideoSegment.aggregate([
    { $match: { matchSessionId: new mongoose.Types.ObjectId(matchSessionId) } },
    {
      $group: {
        _id: null,
        total: { $sum: "$durationSec" },
        lastSequence: { $max: "$sequence" },
      },
    },
  ]);
  return {
    totalDurationSec: rows[0]?.total || 0,
    lastSequence: rows[0]?.lastSequence ?? -1,
  };
};

const recalcSessionDuration = async (matchSessionId: string) => {
  const { totalDurationSec } = await getSessionMetrics(matchSessionId);
  await MatchSession.findByIdAndUpdate(matchSessionId, { totalDurationSec });
  return totalDurationSec;
};

export const createMatchSession = async (ownerId: string, title: string) => {
  assertObjectId(ownerId, "ownerId");
  if (!title || !title.trim()) {
    throw new StreamingServiceError(400, "invalid_title", "title is required");
  }

  const created = await MatchSession.create({
    ownerId,
    title: title.trim(),
    status: "active",
  });
  return created.toObject();
};

export const listUserMatchSessions = async (userId: string) => {
  assertObjectId(userId, "userId");

  const [ownedSessions, participantRoomIds] = await Promise.all([
    MatchSession.find({ ownerId: userId }, { _id: 1 }).lean(),
    RoomParticipant.distinct("roomId", { userId }),
  ]);

  const participantSessionIds = participantRoomIds.length
    ? await StreamRoom.distinct("matchSessionId", { _id: { $in: participantRoomIds } })
    : [];

  const ownedSessionIdSet = new Set(ownedSessions.map((session) => String(session._id)));
  const sessionIds = Array.from(
    new Set([...ownedSessionIdSet, ...participantSessionIds.map((id) => String(id))]),
  );

  if (!sessionIds.length) {
    return { items: [], total: 0 };
  }

  const [sessions, roomStats, segmentStats] = await Promise.all([
    MatchSession.find({ _id: { $in: sessionIds } }).sort({ createdAt: -1, _id: -1 }).lean(),
    StreamRoom.aggregate([
      { $match: { matchSessionId: { $in: sessionIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: "$matchSessionId", roomCount: { $sum: 1 } } },
    ]),
    VideoSegment.aggregate([
      { $match: { matchSessionId: { $in: sessionIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
      {
        $group: {
          _id: "$matchSessionId",
          clipCount: { $sum: 1 },
          lastSequence: { $max: "$sequence" },
          computedTotalDurationSec: { $sum: "$durationSec" },
        },
      },
    ]),
  ]);

  const roomCountBySessionId = new Map(roomStats.map((row) => [String(row._id), row.roomCount]));
  const segmentStatsBySessionId = new Map(segmentStats.map((row) => [String(row._id), row]));

  const items = sessions.map((session) => {
    const sessionId = String(session._id);
    const segmentRow = segmentStatsBySessionId.get(sessionId);
    const isOwner = String(session.ownerId) === userId;

    return {
      _id: session._id,
      ownerId: session.ownerId,
      title: session.title,
      status: session.status,
      endedAt: session.endedAt,
      totalDurationSec: session.totalDurationSec,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      accessRole: isOwner ? "owner" : "participant",
      roomCount: roomCountBySessionId.get(sessionId) || 0,
      clipCount: segmentRow?.clipCount || 0,
      lastSequence: typeof segmentRow?.lastSequence === "number" ? segmentRow.lastSequence : -1,
      computedTotalDurationSec: segmentRow?.computedTotalDurationSec || 0,
    };
  });

  return {
    items,
    total: items.length,
  };
};

export const createRoomForSession = async (matchSessionId: string, ownerId: string) => {
  assertObjectId(matchSessionId, "matchSessionId");
  assertObjectId(ownerId, "ownerId");

  const session = await MatchSession.findById(matchSessionId);
  if (!session) throw new StreamingServiceError(404, "session_not_found", "Match session not found");
  if (String(session.ownerId) !== ownerId) {
    throw new StreamingServiceError(403, "forbidden", "Only owner can create room");
  }

  const room = await StreamRoom.create({
    matchSessionId,
    ownerId,
    status: "active",
  });

  await RoomParticipant.findOneAndUpdate(
    { roomId: room._id, userId: ownerId },
    {
      roomId: room._id,
      userId: ownerId,
      role: "owner",
      joinedAt: new Date(),
      leftAt: undefined,
      status: "active",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return room.toObject();
};

export const joinRoom = async (roomId: string, userId: string) => {
  assertObjectId(roomId, "roomId");
  assertObjectId(userId, "userId");
  const room = await StreamRoom.findById(roomId);
  if (!room) throw new StreamingServiceError(404, "room_not_found", "Room not found");
  if (room.status !== "active") {
    throw new StreamingServiceError(400, "room_closed", "Room is not active");
  }

  const participant = await RoomParticipant.findOneAndUpdate(
    { roomId, userId },
    {
      roomId,
      userId,
      role: String(room.ownerId) === userId ? "owner" : "participant",
      joinedAt: new Date(),
      leftAt: undefined,
      status: "active",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return participant?.toObject ? participant.toObject() : participant;
};

export const leaveRoom = async (roomId: string, userId: string) => {
  assertObjectId(roomId, "roomId");
  assertObjectId(userId, "userId");

  const participant = await RoomParticipant.findOneAndUpdate(
    { roomId, userId, status: "active" },
    { status: "left", leftAt: new Date() },
    { new: true },
  );

  if (!participant) {
    throw new StreamingServiceError(404, "participant_not_found", "Active participant not found");
  }

  return participant.toObject();
};

export const getRoomDetails = async (roomId: string, userId: string) => {
  assertObjectId(roomId, "roomId");
  assertObjectId(userId, "userId");
  const room = await ensureRoomAccess(roomId, userId);
  const session = await MatchSession.findById(room.matchSessionId);
  const participants = await RoomParticipant.find({ roomId, status: "active" });
  return {
    ...room.toObject(),
    participants: participants.map((p) => p.toObject()),
    matchSession: session
      ? {
          _id: session._id,
          title: session.title,
          status: session.status,
          totalDurationSec: session.totalDurationSec,
          endedAt: session.endedAt,
        }
      : null,
  };
};

export const listRoomSegments = async (
  roomId: string,
  userId: string,
  afterSequence?: number,
) => {
  assertObjectId(roomId, "roomId");
  assertObjectId(userId, "userId");
  await ensureRoomAccess(roomId, userId);

  const query: any = { roomId };
  if (typeof afterSequence === "number" && Number.isFinite(afterSequence)) {
    query.sequence = { $gt: afterSequence };
  }

  const segments = await VideoSegment.find(query).sort({ sequence: 1 });
  return segments.map((segment) => ({
    ...segment.toObject(),
    signedDownloadUrl: getObjectS3SignedUrl(segment.s3Key),
  }));
};

export const getMatchSessionTimeline = async (matchSessionId: string, userId: string) => {
  assertObjectId(matchSessionId, "matchSessionId");
  assertObjectId(userId, "userId");

  const session = await ensureMatchSessionAccess(matchSessionId, userId);
  const segments = await VideoSegment.find({ matchSessionId }).sort({ sequence: 1 });

  let accumulatedSec = 0;
  let previousSequence: number | null = null;

  const items = segments.map((segment) => {
    const timelineStartSec = accumulatedSec;
    const timelineEndSec = timelineStartSec + segment.durationSec;
    accumulatedSec = timelineEndSec;

    const sequenceGapFromPrevious =
      previousSequence === null ? 0 : Math.max(segment.sequence - previousSequence - 1, 0);
    previousSequence = segment.sequence;

    return {
      ...segment.toObject(),
      signedDownloadUrl: getObjectS3SignedUrl(segment.s3Key),
      timelineStartSec,
      timelineEndSec,
      sequenceGapFromPrevious,
      isContiguousWithPrevious: sequenceGapFromPrevious === 0,
    };
  });

  const lastSequence = segments.length ? segments[segments.length - 1].sequence : -1;
  const expectedSegmentCount = lastSequence + 1;
  const missingSegmentsCount =
    expectedSegmentCount > 0 ? Math.max(expectedSegmentCount - segments.length, 0) : 0;
  const hasSequenceGaps = missingSegmentsCount > 0;
  const roomCount = await StreamRoom.countDocuments({ matchSessionId });

  return {
    matchSession: {
      _id: session._id,
      ownerId: session.ownerId,
      title: session.title,
      status: session.status,
      endedAt: session.endedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      persistedTotalDurationSec: session.totalDurationSec,
      computedTotalDurationSec: accumulatedSec,
      roomCount,
    },
    timeline: {
      clipCount: segments.length,
      totalDurationSec: accumulatedSec,
      firstSequence: segments.length ? segments[0].sequence : -1,
      lastSequence,
      expectedSegmentCount,
      missingSegmentsCount,
      hasSequenceGaps,
    },
    items,
  };
};

export const createSegment = async (
  matchSessionId: string,
  ownerId: string,
  payload: CreateVideoSegmentDto,
) => {
  assertObjectId(matchSessionId, "matchSessionId");
  assertObjectId(ownerId, "ownerId");
  assertObjectId(payload.roomId, "roomId");
  if (payload.libraryVideoId) {
    assertObjectId(payload.libraryVideoId, "libraryVideoId");
  }

  const session = await MatchSession.findById(matchSessionId);
  if (!session) throw new StreamingServiceError(404, "session_not_found", "Match session not found");
  if (String(session.ownerId) !== ownerId) {
    throw new StreamingServiceError(403, "forbidden", "Only owner can publish segments");
  }

  const room = await StreamRoom.findById(payload.roomId);
  if (!room || String(room.matchSessionId) !== matchSessionId) {
    throw new StreamingServiceError(404, "room_not_found", "Room not found for session");
  }
  if (room.status !== "active") {
    throw new StreamingServiceError(409, "room_closed", "Room is closed");
  }
  if (session.status !== "active") {
    throw new StreamingServiceError(409, "session_ended", "Match session is ended");
  }

  if (!payload.s3Key || !payload.videoUrl) {
    throw new StreamingServiceError(400, "invalid_segment_payload", "s3Key and videoUrl are required");
  }
  if (!Number.isInteger(payload.sequence) || payload.sequence < 0) {
    throw new StreamingServiceError(
      400,
      "invalid_segment_payload",
      "sequence must be a non-negative integer",
    );
  }
  if (!Number.isFinite(payload.durationSec) || payload.durationSec <= 0) {
    throw new StreamingServiceError(
      400,
      "invalid_segment_payload",
      "durationSec must be greater than 0",
    );
  }
  if (!Number.isFinite(payload.startOffsetSec) || payload.startOffsetSec < 0) {
    throw new StreamingServiceError(
      400,
      "invalid_segment_payload",
      "startOffsetSec must be >= 0",
    );
  }
  if (!Number.isFinite(payload.endOffsetSec) || payload.endOffsetSec < payload.startOffsetSec) {
    throw new StreamingServiceError(
      400,
      "invalid_segment_payload",
      "endOffsetSec must be >= startOffsetSec",
    );
  }

  const existing = await VideoSegment.findOne({
    matchSessionId,
    sequence: payload.sequence,
  });
  const sessionMetrics = await getSessionMetrics(matchSessionId);
  const expectedNextSequence = sessionMetrics.lastSequence + 1;
  const hasGap = payload.sequence > expectedNextSequence;

  if (existing) {
    return {
      created: false,
      totalDurationSec: sessionMetrics.totalDurationSec,
      lastSequence: sessionMetrics.lastSequence,
      sequenceInfo: {
        expectedNextSequence,
        hasGap: false,
      },
      segment: {
        ...existing.toObject(),
        signedDownloadUrl: getObjectS3SignedUrl(existing.s3Key),
      },
    };
  }

  const created = await VideoSegment.create({
    matchSessionId,
    roomId: payload.roomId,
    libraryVideoId: payload.libraryVideoId,
    sequence: payload.sequence,
    durationSec: payload.durationSec,
    startOffsetSec: payload.startOffsetSec,
    endOffsetSec: payload.endOffsetSec,
    s3Key: payload.s3Key,
    videoUrl: payload.videoUrl,
    uploadedAt: new Date(),
  });

  const totalDurationSec = await recalcSessionDuration(matchSessionId);
  const { lastSequence } = await getSessionMetrics(matchSessionId);
  const segment = {
    ...created.toObject(),
    signedDownloadUrl: getObjectS3SignedUrl(created.s3Key),
  };

  const segmentUploadedEvent: SegmentUploadedEvent = {
    type: "segment_uploaded",
    roomId: payload.roomId,
    matchSessionId,
    totalDurationSec,
    lastSequence,
    segment,
    at: new Date().toISOString(),
  };

  roomEventsBus.publish(payload.roomId, segmentUploadedEvent);

  return {
    created: true,
    totalDurationSec,
    lastSequence,
    sequenceInfo: {
      expectedNextSequence,
      hasGap,
    },
    segment,
  };
};

export const closeRoomStream = async (roomId: string, ownerId: string) => {
  assertObjectId(roomId, "roomId");
  assertObjectId(ownerId, "ownerId");

  const room = await StreamRoom.findById(roomId);
  if (!room) {
    throw new StreamingServiceError(404, "room_not_found", "Room not found");
  }
  if (String(room.ownerId) !== ownerId) {
    throw new StreamingServiceError(403, "forbidden", "Only owner can close room");
  }

  const session = await MatchSession.findById(room.matchSessionId);
  if (!session) {
    throw new StreamingServiceError(404, "session_not_found", "Match session not found");
  }

  const { totalDurationSec, lastSequence } = await getSessionMetrics(String(session._id));
  const endedAt = new Date();

  await Promise.all([
    StreamRoom.findByIdAndUpdate(roomId, { status: "closed" }),
    MatchSession.findByIdAndUpdate(session._id, {
      status: "ended",
      endedAt,
      totalDurationSec,
    }),
  ]);

  const closedEvent: StreamClosedEvent = {
    type: "stream_closed",
    roomId,
    matchSessionId: String(session._id),
    endedAt: endedAt.toISOString(),
    totalDurationSec,
    lastSequence,
    at: new Date().toISOString(),
  };

  roomEventsBus.publish(roomId, closedEvent);

  return {
    roomId,
    matchSessionId: String(session._id),
    endedAt: endedAt.toISOString(),
    totalDurationSec,
    lastSequence,
    status: "closed",
  };
};
