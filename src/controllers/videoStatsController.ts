import { Request, Response } from "express";
import {
  createVideoStats,
  getVideoStatsByVideoId,
  updateVideoStats,
  deleteVideoStats,
} from "../services/videoStatsService";

/**
 * 📌 Crea estadísticas para un video.
 * Requiere: `videoId`, `sportType`, `teams`, `generatedByModel`.
 */
export const handleCreateVideoStats = async (req: Request, res: Response) => {
  try {
    const { videoId, sportType, teams, generatedByModel } = req.body;

    if (!videoId || !sportType || !teams || !generatedByModel) {
      res.status(400).json({
        message:
          "videoId, sportType, teams, and generatedByModel are required.",
      });
    }

    const stats = await createVideoStats({
      videoId,
      sportType,
      teams,
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
    const videoId = req.params.videoId;
    const stats = await getVideoStatsByVideoId(videoId);
    res.status(200).json(stats);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

/**
 * 📌 Actualiza las estadísticas de un video.
 * `videoId` por `req.params`, datos por `req.body`.
 */
export const handleUpdateVideoStats = async (req: Request, res: Response) => {
  try {
    const videoId = req.params.videoId;
    const updatedStats = await updateVideoStats(videoId, req.body);
    res.status(200).json(updatedStats);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * 📌 Elimina las estadísticas de un video por su ID.
 */
export const handleDeleteVideoStats = async (req: Request, res: Response) => {
  try {
    const videoId = req.params.videoId;
    const result = await deleteVideoStats(videoId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
