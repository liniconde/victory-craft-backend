import { Request, Response } from "express";
import { analyzeVideo } from "../services/aiAnalysisService";

export const analyzeVideoController = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    if (!videoId || typeof videoId !== "string") {
      res.status(400).json({ error: "Invalid video ID" });
      return;
    }

    // Prompt is now determined internally by the service based on sport type
    const analysis = await analyzeVideo(videoId);
    res.json(analysis);
    return;
  } catch (error: any) {
    console.error("Error in analyzeVideoController:", error);
    res.status(500).json({ error: error.message });
    return;
  }
};
