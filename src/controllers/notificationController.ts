import { Request, Response } from "express";
import {
  NotificationServiceError,
  deleteNotification,
  listNotifications,
} from "../services/notificationService";

const handleNotificationError = (res: Response, error: any) => {
  if (error instanceof NotificationServiceError) {
    res.status(error.status).json({ message: error.message, code: error.code });
    return;
  }
  res.status(500).json({ message: error.message || "Internal server error" });
};

export const handleListNotifications = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit || 50);
    const items = await listNotifications({ limit });
    res.status(200).json(items);
  } catch (error: any) {
    handleNotificationError(res, error);
  }
};

export const handleDeleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await deleteNotification(id as string);
    res.status(200).json(result);
  } catch (error: any) {
    handleNotificationError(res, error);
  }
};
