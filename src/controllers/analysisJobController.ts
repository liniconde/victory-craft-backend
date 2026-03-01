import { Request, Response } from "express";
import {
  AnalysisJobServiceError,
  createPromptAnalysisJob,
  getAnalysisJobStatus,
} from "../services/analysisJobService";

const handleError = (res: Response, error: any) => {
  if (error instanceof AnalysisJobServiceError) {
    res.status(error.status).json({ message: error.message, code: error.code });
    return;
  }
  res.status(500).json({ message: error.message || "Internal server error" });
};

export const handleCreateAnalyzeVideoJob = async (req: Request, res: Response) => {
  try {
    const { id: videoId } = req.params;
    const result = await createPromptAnalysisJob(videoId as string, req.body || {});
    res.status(201).json({
      message: "Analysis job created and queued",
      job: result,
    });
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleGetAnalyzeVideoJobStatus = async (req: Request, res: Response) => {
  try {
    const { id: videoId, jobId } = req.params;
    const result = await getAnalysisJobStatus(videoId as string, jobId as string);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};
