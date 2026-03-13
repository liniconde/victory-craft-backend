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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSubscribeRoomEvents = exports.handleCloseRoom = exports.handleLeaveRoom = exports.handleJoinRoom = exports.handleGetRoomSegments = exports.handleGetRoom = exports.handleGetMatchSessionTimeline = exports.handleCreateSegment = exports.handleCreateRoomForSession = exports.handleListMatchSessions = exports.handleCreateMatchSession = void 0;
const streamingService_1 = require("../services/streamingService");
const roomEventsService_1 = require("../services/roomEventsService");
const getAuthUserId = (req) => { var _a, _b, _c; return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id) || ((_c = req.user) === null || _c === void 0 ? void 0 : _c.userId); };
const handleError = (res, error) => {
    if (error instanceof streamingService_1.StreamingServiceError) {
        res.status(error.status).json({ message: error.message, code: error.code });
        return;
    }
    res.status(500).json({ message: (error === null || error === void 0 ? void 0 : error.message) || "Internal server error" });
};
const handleCreateMatchSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const ownerId = getAuthUserId(req);
        if (!ownerId) {
            res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
            return;
        }
        const title = String(((_a = req.body) === null || _a === void 0 ? void 0 : _a.title) || "");
        const result = yield (0, streamingService_1.createMatchSession)(ownerId, title);
        res.status(201).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleCreateMatchSession = handleCreateMatchSession;
const handleListMatchSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getAuthUserId(req);
        if (!userId) {
            res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
            return;
        }
        const result = yield (0, streamingService_1.listUserMatchSessions)(userId);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleListMatchSessions = handleListMatchSessions;
const handleCreateRoomForSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ownerId = getAuthUserId(req);
        if (!ownerId) {
            res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
            return;
        }
        const result = yield (0, streamingService_1.createRoomForSession)(req.params.id, ownerId);
        res.status(201).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleCreateRoomForSession = handleCreateRoomForSession;
const handleCreateSegment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ownerId = getAuthUserId(req);
        if (!ownerId) {
            res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
            return;
        }
        const result = yield (0, streamingService_1.createSegment)(req.params.id, ownerId, req.body || {});
        res.status(result.created ? 201 : 200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleCreateSegment = handleCreateSegment;
const handleGetMatchSessionTimeline = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getAuthUserId(req);
        if (!userId) {
            res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
            return;
        }
        const result = yield (0, streamingService_1.getMatchSessionTimeline)(req.params.id, userId);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleGetMatchSessionTimeline = handleGetMatchSessionTimeline;
const handleGetRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getAuthUserId(req);
        if (!userId) {
            res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
            return;
        }
        const result = yield (0, streamingService_1.getRoomDetails)(req.params.id, userId);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleGetRoom = handleGetRoom;
const handleGetRoomSegments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getAuthUserId(req);
        if (!userId) {
            res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
            return;
        }
        const afterSequenceValue = req.query.afterSequence;
        const afterSequence = typeof afterSequenceValue !== "undefined" ? Number(afterSequenceValue) : undefined;
        if (typeof afterSequence !== "undefined" && !Number.isFinite(afterSequence)) {
            res.status(400).json({ message: "afterSequence must be a number", code: "invalid_after_sequence" });
            return;
        }
        const result = yield (0, streamingService_1.listRoomSegments)(req.params.id, userId, afterSequence);
        res.status(200).json({ items: result });
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleGetRoomSegments = handleGetRoomSegments;
const handleJoinRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getAuthUserId(req);
        if (!userId) {
            res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
            return;
        }
        const result = yield (0, streamingService_1.joinRoom)(req.params.id, userId);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleJoinRoom = handleJoinRoom;
const handleLeaveRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getAuthUserId(req);
        if (!userId) {
            res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
            return;
        }
        const result = yield (0, streamingService_1.leaveRoom)(req.params.id, userId);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleLeaveRoom = handleLeaveRoom;
const handleCloseRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ownerId = getAuthUserId(req);
        if (!ownerId) {
            res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
            return;
        }
        const result = yield (0, streamingService_1.closeRoomStream)(req.params.id, ownerId);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleCloseRoom = handleCloseRoom;
const handleSubscribeRoomEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = getAuthUserId(req);
        if (!userId) {
            res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
            return;
        }
        yield (0, streamingService_1.getRoomDetails)(req.params.id, userId);
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        (_a = res.flushHeaders) === null || _a === void 0 ? void 0 : _a.call(res);
        const roomId = req.params.id;
        const heartbeat = setInterval(() => {
            res.write(`event: heartbeat\\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\\n\\n`);
        }, 15000);
        const unsubscribe = roomEventsService_1.roomEventsBus.subscribe(roomId, (event) => {
            res.write(`event: ${event.type || "message"}\\ndata: ${JSON.stringify(event)}\\n\\n`);
        });
        req.on("close", () => {
            clearInterval(heartbeat);
            unsubscribe();
            res.end();
        });
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.handleSubscribeRoomEvents = handleSubscribeRoomEvents;
//# sourceMappingURL=streamingController.js.map