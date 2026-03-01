import mongoose from "mongoose";
import Notification from "../models/Notification";

export class NotificationServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const createNotification = async (params: {
  type: "analysis_queued" | "analysis_completed" | "analysis_failed" | "info";
  message: string;
  videoId?: string;
  analysisJobId?: string;
  metadata?: Record<string, any>;
}) => {
  const doc = await Notification.create({
    type: params.type,
    message: params.message,
    videoId: params.videoId,
    analysisJobId: params.analysisJobId,
    metadata: params.metadata,
  });
  return doc.toObject();
};

export const listNotifications = async (params?: { limit?: number }) => {
  const limit = Math.min(100, Math.max(1, params?.limit || 50));
  const rows = await Notification.find().sort({ createdAt: -1 }).limit(limit);
  return rows.map((row) => row.toObject());
};

export const deleteNotification = async (notificationId: string) => {
  if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new NotificationServiceError(400, "invalid_notification_id", "Invalid notification id");
  }

  const deleted = await Notification.findByIdAndDelete(notificationId);
  if (!deleted) {
    throw new NotificationServiceError(404, "notification_not_found", "Notification not found");
  }

  return { message: "Notification deleted successfully" };
};
