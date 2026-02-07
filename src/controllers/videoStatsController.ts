import { Request, Response } from "express";
import {
  createVideoStats,
  getVideoStatsByVideoId,
  updateVideoStats,
  deleteVideoStats,
} from "../services/videoStatsService";

/**
 * 📌 Crea estadísticas para un video.
 * Requiere: `videoId`, `statistics` (incluye `teams`), `generatedByModel`.
 */
export const handleCreateVideoStats = async (req: Request, res: Response) => {
  try {
    const { videoId, statistics, generatedByModel } = req.body;

    if (!videoId || !statistics || !statistics.sportType || !generatedByModel) {
      res.status(400).json({
        message:
          "videoId, statistics.sportType (and optional statistics.teams), and generatedByModel are required.",
      });
      return;
    }

    const stats = await createVideoStats({
      videoId,
      statistics,
      generatedByModel,
    });
    res.status(201).json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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
    if (!stats) {
      res.status(404).json({ message: "Stats not found" });
      return;
    }
    res.status(200).json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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
    if (!stats) {
      res.status(404).json({ message: "Stats not found" });
      return;
    }
    res.status(200).json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
  }
};
