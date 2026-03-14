import { Request, Response } from "express";
import {
  enqueueWorkersStart,
  WorkersControlServiceError,
} from "../services/workersControlService";

type ReqWithUser = Request & {
  user?: {
    id?: string;
    _id?: string;
    userId?: string;
  };
};

const getAuthUserId = (req: ReqWithUser) =>
  req.user?.id || req.user?._id || req.user?.userId;

export const handleEnqueueWorkersStart = async (
  req: ReqWithUser,
  res: Response,
) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized", code: "unauthorized" });
      return;
    }

    const result = await enqueueWorkersStart({
      requestedBy: userId,
      reason:
        typeof req.body?.reason === "string" ? req.body.reason : undefined,
      metadata:
        req.body?.metadata && typeof req.body.metadata === "object"
          ? req.body.metadata
          : undefined,
    });

    res.status(202).json({
      message: "Workers start request queued",
      ...result,
    });
  } catch (error: any) {
    if (error instanceof WorkersControlServiceError) {
      res.status(error.status).json({ message: error.message, code: error.code });
      return;
    }

    res.status(500).json({ message: error?.message || "Internal server error" });
  }
};
