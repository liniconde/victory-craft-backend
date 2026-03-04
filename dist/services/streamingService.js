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
exports.createSegment = exports.listRoomSegments = exports.getRoomDetails = exports.leaveRoom = exports.joinRoom = exports.createRoomForSession = exports.createMatchSession = exports.StreamingServiceError = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MatchSession_1 = __importDefault(require("../models/MatchSession"));
const StreamRoom_1 = __importDefault(require("../models/StreamRoom"));
const RoomParticipant_1 = __importDefault(require("../models/RoomParticipant"));
const VideoSegment_1 = __importDefault(require("../models/VideoSegment"));
const s3FilesService_1 = require("./s3FilesService");
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
const recalcSessionDuration = (matchSessionId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const rows = yield VideoSegment_1.default.aggregate([
        { $match: { matchSessionId: new mongoose_1.default.Types.ObjectId(matchSessionId) } },
        { $group: { _id: null, total: { $sum: "$durationSec" } } },
    ]);
    const totalDurationSec = ((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
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
    const participants = yield RoomParticipant_1.default.find({ roomId, status: "active" });
    return Object.assign(Object.assign({}, room.toObject()), { participants: participants.map((p) => p.toObject()) });
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
    if (existing) {
        return {
            created: false,
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
    const segment = Object.assign(Object.assign({}, created.toObject()), { signedDownloadUrl: (0, s3FilesService_1.getObjectS3SignedUrl)(created.s3Key) });
    const segmentUploadedEvent = {
        type: "segment_uploaded",
        roomId: payload.roomId,
        matchSessionId,
        totalDurationSec,
        segment,
        at: new Date().toISOString(),
    };
    roomEventsService_1.roomEventsBus.publish(payload.roomId, segmentUploadedEvent);
    return { created: true, segment, totalDurationSec };
});
exports.createSegment = createSegment;
//# sourceMappingURL=streamingService.js.map