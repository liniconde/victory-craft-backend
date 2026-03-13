import { Request, Response } from "express";
import {
  createMatchSession,
  createRoomForSession,
  createSegment,
  closeRoomStream,
  getMatchSessionTimeline,
  getRoomDetails,
  joinRoom,
  leaveRoom,
  listRoomSegments,
  StreamingServiceError,
} from "../services/streamingService";
import { roomEventsBus } from "../services/roomEventsService";

type ReqWithUser = Request & {
  user?: {
    id?: string;
    _id?: string;
    userId?: string;
  };
};

const getAuthUserId = (req: ReqWithUser) => req.user?.id || req.user?._id || req.user?.userId;

const handleError = (res: Response, error: any) => {
  if (error instanceof StreamingServiceError) {
    res.status(error.status).json({ message: error.message, code: error.code });
    return;
  }
  res.status(500).json({ message: error?.message || "Internal server error" });
};

export const handleCreateMatchSession = async (req: ReqWithUser, res: Response) => {
  try {
    const ownerId = getAuthUserId(req);
    if (!ownerId) {
      res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
      return;
    }

    const title = String(req.body?.title || "");
    const result = await createMatchSession(ownerId, title);
    res.status(201).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleCreateRoomForSession = async (req: ReqWithUser, res: Response) => {
  try {
    const ownerId = getAuthUserId(req);
    if (!ownerId) {
      res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
      return;
    }

    const result = await createRoomForSession(req.params.id as string, ownerId);
    res.status(201).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleCreateSegment = async (req: ReqWithUser, res: Response) => {
  try {
    const ownerId = getAuthUserId(req);
    if (!ownerId) {
      res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
      return;
    }

    const result = await createSegment(req.params.id as string, ownerId, req.body || {});
    res.status(result.created ? 201 : 200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleGetMatchSessionTimeline = async (req: ReqWithUser, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
      return;
    }

    const result = await getMatchSessionTimeline(req.params.id as string, userId);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleGetRoom = async (req: ReqWithUser, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
      return;
    }

    const result = await getRoomDetails(req.params.id as string, userId);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleGetRoomSegments = async (req: ReqWithUser, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
      return;
    }

    const afterSequenceValue = req.query.afterSequence;
    const afterSequence =
      typeof afterSequenceValue !== "undefined" ? Number(afterSequenceValue) : undefined;

    if (typeof afterSequence !== "undefined" && !Number.isFinite(afterSequence)) {
      res.status(400).json({ message: "afterSequence must be a number", code: "invalid_after_sequence" });
      return;
    }

    const result = await listRoomSegments(req.params.id as string, userId, afterSequence);
    res.status(200).json({ items: result });
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleJoinRoom = async (req: ReqWithUser, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
      return;
    }

    const result = await joinRoom(req.params.id as string, userId);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleLeaveRoom = async (req: ReqWithUser, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
      return;
    }

    const result = await leaveRoom(req.params.id as string, userId);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleCloseRoom = async (req: ReqWithUser, res: Response) => {
  try {
    const ownerId = getAuthUserId(req);
    if (!ownerId) {
      res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
      return;
    }

    const result = await closeRoomStream(req.params.id as string, ownerId);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleSubscribeRoomEvents = async (req: ReqWithUser, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
      return;
    }

    await getRoomDetails(req.params.id as string, userId);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const roomId = req.params.id as string;
    const heartbeat = setInterval(() => {
      res.write(`event: heartbeat\\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\\n\\n`);
    }, 15000);

    const unsubscribe = roomEventsBus.subscribe(roomId, (event) => {
      res.write(`event: ${event.type || "message"}\\ndata: ${JSON.stringify(event)}\\n\\n`);
    });

    req.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
      res.end();
    });
  } catch (error: any) {
    handleError(res, error);
  }
};
