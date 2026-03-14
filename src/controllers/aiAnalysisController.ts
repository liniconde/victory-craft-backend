import { Request, Response } from "express";
import { analyzeVideo } from "../services/aiAnalysisService";
import { getGeminiTokenUsageSummary } from "../services/geminiTokenUsageService";

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

export const getLastGeminiTokenUsageController = async (_req: Request, res: Response) => {
  try {
    const summary = await getGeminiTokenUsageSummary();
    if (!summary.last) {
      res.status(404).json({
        error: "No Gemini token usage has been registered yet.",
      });
      return;
    }

    res.status(200).json(summary);
    return;
  } catch (error: any) {
    console.error("Error in getLastGeminiTokenUsageController:", error);
    res.status(500).json({ error: error.message });
    return;
  }
};
