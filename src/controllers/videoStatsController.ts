import { Request, Response } from "express";
import {
  createVideoStats,
  getVideoStatsByVideoId,
  listFootballVideosWithGoals,
  updateVideoStats,
  deleteVideoStats,
  VideoStatsServiceError,
} from "../services/videoStatsService";

const handleVideoStatsError = (res: Response, error: any) => {
  if (error instanceof VideoStatsServiceError) {
    res.status(error.status).json({ message: error.message, code: error.code });
    return;
  }
  res.status(500).json({ message: error.message });
};

/**
 * 📌 Crea estadísticas para un video.
 * Requiere: `videoId`, `statistics` (incluye `teams`), `generatedByModel`.
 */
export const handleCreateVideoStats = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.body;
    const sportType = req.body?.sportType || req.body?.statistics?.sportType;

    if (!videoId || !sportType) {
      res.status(400).json({
        message:
          "videoId and sportType are required (sportType can be inside statistics.sportType for backward compatibility).",
      });
      return;
    }

    const stats = await createVideoStats(req.body);
    res.status(201).json(stats);
  } catch (error: any) {
    handleVideoStatsError(res, error);
  }
};

/**
 * 📌 Obtiene las estadísticas de un video por su ID.
 * `videoId` viene por `req.params`.
 */
export const handleGetVideoStats = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const stats = await getVideoStatsByVideoId(videoId as string);
    res.status(200).json(stats);
  } catch (error: any) {
    handleVideoStatsError(res, error);
  }
};

/**
 * 📌 Actualiza las estadísticas de un video.
 * `videoId` por `req.params`, datos por `req.body`.
 */
export const handleUpdateVideoStats = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const stats = await updateVideoStats(videoId as string, req.body);
    res.status(200).json(stats);
  } catch (error: any) {
    handleVideoStatsError(res, error);
  }
};

/**
 * 📌 Elimina las estadísticas de un video por su ID.
 */
export const handleDeleteVideoStats = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const result = await deleteVideoStats(videoId as string);
    res.status(200).json(result);
  } catch (error: any) {
    handleVideoStatsError(res, error);
  }
};

export const handleListFootballVideosWithGoals = async (
  req: Request,
  res: Response,
) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (!Number.isFinite(page) || !Number.isFinite(limit)) {
      res.status(400).json({ message: "page and limit must be valid numbers" });
      return;
    }

    const result = await listFootballVideosWithGoals(page, limit);
    res.status(200).json(result);
  } catch (error: any) {
    handleVideoStatsError(res, error);
  }
};
