"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeRoomStream = exports.createSegment = exports.getMatchSessionTimeline = exports.listRoomSegments = exports.getRoomDetails = exports.leaveRoom = exports.joinRoom = exports.createRoomForSession = exports.deleteMatchSessionById = exports.listUserMatchSessions = exports.createMatchSession = exports.StreamingServiceError = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MatchSession_1 = __importDefault(require("../models/MatchSession"));
const StreamRoom_1 = __importDefault(require("../models/StreamRoom"));
const RoomParticipant_1 = __importDefault(require("../models/RoomParticipant"));
const VideoSegment_1 = __importDefault(require("../models/VideoSegment"));
const s3FilesService_1 = require("./s3FilesService");
const s3FilesService_2 = require("./s3FilesService");
const roomEventsService_1 = require("./roomEventsService");
class StreamingServiceError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.StreamingServiceError = StreamingServiceError;
const assertObjectId = (value, field) => {
    if (!value || !mongoose_1.default.Types.ObjectId.isValid(value)) {
        throw new StreamingServiceError(400, `invalid_${field}`, `${field} is invalid`);
    }
};
const isS3NotFoundError = (error) => {
    const errorCode = (error === null || error === void 0 ? void 0 : error.code) || (error === null || error === void 0 ? void 0 : error.name);
    return errorCode === "NoSuchKey" || errorCode === "NotFound";
};
const ensureRoomAccess = (roomId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const room = yield StreamRoom_1.default.findById(roomId);
    if (!room)
        throw new StreamingServiceError(404, "room_not_found", "Room not found");
    if (String(room.ownerId) === userId)
        return room;
    const participant = yield RoomParticipant_1.default.findOne({ roomId, userId, status: "active" });
    if (!participant)
        throw new StreamingServiceError(403, "forbidden", "User is not part of room");
    return room;
});
const ensureMatchSessionAccess = (matchSessionId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield MatchSession_1.default.findById(matchSessionId);
    if (!session) {
        throw new StreamingServiceError(404, "session_not_found", "Match session not found");
    }
    if (String(session.ownerId) === userId)
        return session;
    const rooms = yield StreamRoom_1.default.find({ matchSessionId }, { _id: 1 }).lean();
    const roomIds = rooms.map((room) => room._id);
    if (!roomIds.length) {
        throw new StreamingServiceError(403, "forbidden", "User is not part of match session");
    }
    const participant = yield RoomParticipant_1.default.findOne({
        roomId: { $in: roomIds },
        userId,
        status: "active",
    });
    if (!participant) {
        throw new StreamingServiceError(403, "forbidden", "User is not part of match session");
    }
    return session;
});
const getSessionMetrics = (matchSessionId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const rows = yield VideoSegment_1.default.aggregate([
        { $match: { matchSessionId: new mongoose_1.default.Types.ObjectId(matchSessionId) } },
        {
            $group: {
                _id: null,
                total: { $sum: "$durationSec" },
                lastSequence: { $max: "$sequence" },
            },
        },
    ]);
    return {
        totalDurationSec: ((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
        lastSequence: (_c = (_b = rows[0]) === null || _b === void 0 ? void 0 : _b.lastSequence) !== null && _c !== void 0 ? _c : -1,
    };
});
const recalcSessionDuration = (matchSessionId) => __awaiter(void 0, void 0, void 0, function* () {
    const { totalDurationSec } = yield getSessionMetrics(matchSessionId);
    yield MatchSession_1.default.findByIdAndUpdate(matchSessionId, { totalDurationSec });
    return totalDurationSec;
});
const createMatchSession = (ownerId, title) => __awaiter(void 0, void 0, void 0, function* () {
    assertObjectId(ownerId, "ownerId");
    if (!title || !title.trim()) {
        throw new StreamingServiceError(400, "invalid_title", "title is required");
    }
    const created = yield MatchSession_1.default.create({
        ownerId,
        title: title.trim(),
        status: "active",
    });
    return created.toObject();
});
exports.createMatchSession = createMatchSession;
const listUserMatchSessions = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    assertObjectId(userId, "userId");
    const [ownedSessions, participantRoomIds] = yield Promise.all([
        MatchSession_1.default.find({ ownerId: userId }, { _id: 1 }).lean(),
        RoomParticipant_1.default.distinct("roomId", { userId }),
    ]);
    const participantSessionIds = participantRoomIds.length
        ? yield StreamRoom_1.default.distinct("matchSessionId", { _id: { $in: participantRoomIds } })
        : [];
    const ownedSessionIdSet = new Set(ownedSessions.map((session) => String(session._id)));
    const sessionIds = Array.from(new Set([...ownedSessionIdSet, ...participantSessionIds.map((id) => String(id))]));
    if (!sessionIds.length) {
        return { items: [], total: 0 };
    }
    const [sessions, roomStats, segmentStats] = yield Promise.all([
        MatchSession_1.default.find({ _id: { $in: sessionIds } }).sort({ createdAt: -1, _id: -1 }).lean(),
        StreamRoom_1.default.aggregate([
            { $match: { matchSessionId: { $in: sessionIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) } } },
            { $group: { _id: "$matchSessionId", roomCount: { $sum: 1 } } },
        ]),
        VideoSegment_1.default.aggregate([
            { $match: { matchSessionId: { $in: sessionIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) } } },
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
            clipCount: (segmentRow === null || segmentRow === void 0 ? void 0 : segmentRow.clipCount) || 0,
            lastSequence: typeof (segmentRow === null || segmentRow === void 0 ? void 0 : segmentRow.lastSequence) === "number" ? segmentRow.lastSequence : -1,
            computedTotalDurationSec: (segmentRow === null || segmentRow === void 0 ? void 0 : segmentRow.computedTotalDurationSec) || 0,
        };
    });
    return {
        items,
        total: items.length,
    };
});
exports.listUserMatchSessions = listUserMatchSessions;
const deleteMatchSessionById = (matchSessionId, ownerId) => __awaiter(void 0, void 0, void 0, function* () {
    assertObjectId(matchSessionId, "matchSessionId");
    assertObjectId(ownerId, "ownerId");
    const session = yield MatchSession_1.default.findById(matchSessionId);
    if (!session) {
        throw new StreamingServiceError(404, "session_not_found", "Match session not found");
    }
    if (String(session.ownerId) !== ownerId) {
        throw new StreamingServiceError(403, "forbidden", "Only owner can delete match session");
    }
    const [rooms, segments] = yield Promise.all([
        StreamRoom_1.default.find({ matchSessionId }, { _id: 1 }).lean(),
        VideoSegment_1.default.find({ matchSessionId }, { s3Key: 1 }).lean(),
    ]);
    const roomIds = rooms.map((room) => room._id);
    const s3Keys = new Set();
    segments.forEach((segment) => {
        const key = String((segment === null || segment === void 0 ? void 0 : segment.s3Key) || "").trim();
        if (key)
            s3Keys.add(key);
    });
    const s3DeleteErrors = [];
    yield Promise.all([...s3Keys].map((objectKey) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield (0, s3FilesService_2.deleteObjectS3)(objectKey);
        }
        catch (error) {
            if (!isS3NotFoundError(error)) {
                s3DeleteErrors.push(`${objectKey}: ${(error === null || error === void 0 ? void 0 : error.message) || "unknown error"}`);
            }
        }
    })));
    if (s3DeleteErrors.length > 0) {
        throw new StreamingServiceError(502, "s3_delete_failed", `Failed to delete object(s) from S3: ${s3DeleteErrors.join(" | ")}`);
    }
    yield Promise.all([
        MatchSession_1.default.findByIdAndDelete(matchSessionId),
        StreamRoom_1.default.deleteMany({ matchSessionId }),
        VideoSegment_1.default.deleteMany({ matchSessionId }),
        roomIds.length ? RoomParticipant_1.default.deleteMany({ roomId: { $in: roomIds } }) : Promise.resolve(),
    ]);
    return {
        message: "Match session deleted successfully",
        deletedMatchSessionId: matchSessionId,
        deletedRoomsCount: rooms.length,
        deletedSegmentsCount: segments.length,
        deletedS3ObjectsCount: s3Keys.size,
    };
});
exports.deleteMatchSessionById = deleteMatchSessionById;
const createRoomForSession = (matchSessionId, ownerId) => __awaiter(void 0, void 0, void 0, function* () {
    assertObjectId(matchSessionId, "matchSessionId");
    assertObjectId(ownerId, "ownerId");
    const session = yield MatchSession_1.default.findById(matchSessionId);
    if (!session)
        throw new StreamingServiceError(404, "session_not_found", "Match session not found");
    if (String(session.ownerId) !== ownerId) {
        throw new StreamingServiceError(403, "forbidden", "Only owner can create room");
    }
    const room = yield StreamRoom_1.default.create({
        matchSessionId,
        ownerId,
        status: "active",
    });
    yield RoomParticipant_1.default.findOneAndUpdate({ roomId: room._id, userId: ownerId }, {
        roomId: room._id,
        userId: ownerId,
        role: "owner",
        joinedAt: new Date(),
        leftAt: undefined,
        status: "active",
    }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return room.toObject();
});
exports.createRoomForSession = createRoomForSession;
const joinRoom = (roomId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    assertObjectId(roomId, "roomId");
    assertObjectId(userId, "userId");
    const room = yield StreamRoom_1.default.findById(roomId);
    if (!room)
        throw new StreamingServiceError(404, "room_not_found", "Room not found");
    if (room.status !== "active") {
        throw new StreamingServiceError(400, "room_closed", "Room is not active");
    }
    const participant = yield RoomParticipant_1.default.findOneAndUpdate({ roomId, userId }, {
        roomId,
        userId,
        role: String(room.ownerId) === userId ? "owner" : "participant",
        joinedAt: new Date(),
        leftAt: undefined,
        status: "active",
    }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return (participant === null || participant === void 0 ? void 0 : participant.toObject) ? participant.toObject() : participant;
});
exports.joinRoom = joinRoom;
const leaveRoom = (roomId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    assertObjectId(roomId, "roomId");
    assertObjectId(userId, "userId");
    const participant = yield RoomParticipant_1.default.findOneAndUpdate({ roomId, userId, status: "active" }, { status: "left", leftAt: new Date() }, { new: true });
    if (!participant) {
        throw new StreamingServiceError(404, "participant_not_found", "Active participant not found");
    }
    return participant.toObject();
});
exports.leaveRoom = leaveRoom;
const getRoomDetails = (roomId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    assertObjectId(roomId, "roomId");
    assertObjectId(userId, "userId");
    const room = yield ensureRoomAccess(roomId, userId);
    const session = yield MatchSession_1.default.findById(room.matchSessionId);
    const participants = yield RoomParticipant_1.default.find({ roomId, status: "active" });
    return Object.assign(Object.assign({}, room.toObject()), { participants: participants.map((p) => p.toObject()), matchSession: session
            ? {
                _id: session._id,
                title: session.title,
                status: session.status,
                totalDurationSec: session.totalDurationSec,
                endedAt: session.endedAt,
            }
            : null });
});
exports.getRoomDetails = getRoomDetails;
const listRoomSegments = (roomId, userId, afterSequence) => __awaiter(void 0, void 0, void 0, function* () {
    assertObjectId(roomId, "roomId");
    assertObjectId(userId, "userId");
    yield ensureRoomAccess(roomId, userId);
    const query = { roomId };
    if (typeof afterSequence === "number" && Number.isFinite(afterSequence)) {
        query.sequence = { $gt: afterSequence };
    }
    const segments = yield VideoSegment_1.default.find(query).sort({ sequence: 1 });
    return segments.map((segment) => (Object.assign(Object.assign({}, segment.toObject()), { signedDownloadUrl: (0, s3FilesService_1.getObjectS3SignedUrl)(segment.s3Key) })));
});
exports.listRoomSegments = listRoomSegments;
const getMatchSessionTimeline = (matchSessionId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    assertObjectId(matchSessionId, "matchSessionId");
    assertObjectId(userId, "userId");
    const session = yield ensureMatchSessionAccess(matchSessionId, userId);
    const segments = yield VideoSegment_1.default.find({ matchSessionId }).sort({ sequence: 1 });
    let accumulatedSec = 0;
    let previousSequence = null;
    const items = segments.map((segment) => {
        const timelineStartSec = accumulatedSec;
        const timelineEndSec = timelineStartSec + segment.durationSec;
        accumulatedSec = timelineEndSec;
        const sequenceGapFromPrevious = previousSequence === null ? 0 : Math.max(segment.sequence - previousSequence - 1, 0);
        previousSequence = segment.sequence;
        return Object.assign(Object.assign({}, segment.toObject()), { signedDownloadUrl: (0, s3FilesService_1.getObjectS3SignedUrl)(segment.s3Key), timelineStartSec,
            timelineEndSec,
            sequenceGapFromPrevious, isContiguousWithPrevious: sequenceGapFromPrevious === 0 });
    });
    const lastSequence = segments.length ? segments[segments.length - 1].sequence : -1;
    const expectedSegmentCount = lastSequence + 1;
    const missingSegmentsCount = expectedSegmentCount > 0 ? Math.max(expectedSegmentCount - segments.length, 0) : 0;
    const hasSequenceGaps = missingSegmentsCount > 0;
    const roomCount = yield StreamRoom_1.default.countDocuments({ matchSessionId });
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
});
exports.getMatchSessionTimeline = getMatchSessionTimeline;
const createSegment = (matchSessionId, ownerId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    assertObjectId(matchSessionId, "matchSessionId");
    assertObjectId(ownerId, "ownerId");
    assertObjectId(payload.roomId, "roomId");
    if (payload.libraryVideoId) {
        assertObjectId(payload.libraryVideoId, "libraryVideoId");
    }
    const session = yield MatchSession_1.default.findById(matchSessionId);
    if (!session)
        throw new StreamingServiceError(404, "session_not_found", "Match session not found");
    if (String(session.ownerId) !== ownerId) {
        throw new StreamingServiceError(403, "forbidden", "Only owner can publish segments");
    }
    const room = yield StreamRoom_1.default.findById(payload.roomId);
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
        throw new StreamingServiceError(400, "invalid_segment_payload", "sequence must be a non-negative integer");
    }
    if (!Number.isFinite(payload.durationSec) || payload.durationSec <= 0) {
        throw new StreamingServiceError(400, "invalid_segment_payload", "durationSec must be greater than 0");
    }
    if (!Number.isFinite(payload.startOffsetSec) || payload.startOffsetSec < 0) {
        throw new StreamingServiceError(400, "invalid_segment_payload", "startOffsetSec must be >= 0");
    }
    if (!Number.isFinite(payload.endOffsetSec) || payload.endOffsetSec < payload.startOffsetSec) {
        throw new StreamingServiceError(400, "invalid_segment_payload", "endOffsetSec must be >= startOffsetSec");
    }
    const existing = yield VideoSegment_1.default.findOne({
        matchSessionId,
        sequence: payload.sequence,
    });
    const sessionMetrics = yield getSessionMetrics(matchSessionId);
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
            segment: Object.assign(Object.assign({}, existing.toObject()), { signedDownloadUrl: (0, s3FilesService_1.getObjectS3SignedUrl)(existing.s3Key) }),
        };
    }
    const created = yield VideoSegment_1.default.create({
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
    const totalDurationSec = yield recalcSessionDuration(matchSessionId);
    const { lastSequence } = yield getSessionMetrics(matchSessionId);
    const segment = Object.assign(Object.assign({}, created.toObject()), { signedDownloadUrl: (0, s3FilesService_1.getObjectS3SignedUrl)(created.s3Key) });
    const segmentUploadedEvent = {
        type: "segment_uploaded",
        roomId: payload.roomId,
        matchSessionId,
        totalDurationSec,
        lastSequence,
        segment,
        at: new Date().toISOString(),
    };
    roomEventsService_1.roomEventsBus.publish(payload.roomId, segmentUploadedEvent);
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
});
exports.createSegment = createSegment;
const closeRoomStream = (roomId, ownerId) => __awaiter(void 0, void 0, void 0, function* () {
    assertObjectId(roomId, "roomId");
    assertObjectId(ownerId, "ownerId");
    const room = yield StreamRoom_1.default.findById(roomId);
    if (!room) {
        throw new StreamingServiceError(404, "room_not_found", "Room not found");
    }
    if (String(room.ownerId) !== ownerId) {
        throw new StreamingServiceError(403, "forbidden", "Only owner can close room");
    }
    const session = yield MatchSession_1.default.findById(room.matchSessionId);
    if (!session) {
        throw new StreamingServiceError(404, "session_not_found", "Match session not found");
    }
    const { totalDurationSec, lastSequence } = yield getSessionMetrics(String(session._id));
    const endedAt = new Date();
    yield Promise.all([
        StreamRoom_1.default.findByIdAndUpdate(roomId, { status: "closed" }),
        MatchSession_1.default.findByIdAndUpdate(session._id, {
            status: "ended",
            endedAt,
            totalDurationSec,
        }),
    ]);
    const closedEvent = {
        type: "stream_closed",
        roomId,
        matchSessionId: String(session._id),
        endedAt: endedAt.toISOString(),
        totalDurationSec,
        lastSequence,
        at: new Date().toISOString(),
    };
    roomEventsService_1.roomEventsBus.publish(roomId, closedEvent);
    return {
        roomId,
        matchSessionId: String(session._id),
        endedAt: endedAt.toISOString(),
        totalDurationSec,
        lastSequence,
        status: "closed",
    };
});
exports.closeRoomStream = closeRoomStream;
//# sourceMappingURL=streamingService.js.map