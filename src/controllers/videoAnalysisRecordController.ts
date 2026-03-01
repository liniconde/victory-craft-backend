import { Request, Response } from "express";
import {
  VideoAnalysisRecordServiceError,
  listVideoAnalysisRecordsByVideoId,
} from "../services/videoAnalysisRecordService";

export const handleListVideoAnalysisRecords = async (req: Request, res: Response) => {
  try {
    const { id: videoId } = req.params;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const result = await listVideoAnalysisRecordsByVideoId(videoId as string, { page, limit });
    res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof VideoAnalysisRecordServiceError) {
      res.status(error.status).json({ message: error.message, code: error.code });
      return;
    }
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};
