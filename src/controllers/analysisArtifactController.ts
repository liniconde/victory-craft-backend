import { Request, Response } from "express";
import {
  AnalysisArtifactServiceError,
  getAnalysisArtifactSignedDownloadUrl,
  listAnalysisArtifactsByJobId,
  listAnalysisArtifactsByVideoId,
} from "../services/analysisArtifactService";

const handleArtifactError = (res: Response, error: any) => {
  if (error instanceof AnalysisArtifactServiceError) {
    res.status(error.status).json({ message: error.message, code: error.code });
    return;
  }
  res.status(500).json({ message: error.message || "Internal server error" });
};

export const handleListVideoAnalysisArtifacts = async (req: Request, res: Response) => {
  try {
    const { id: videoId } = req.params;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const result = await listAnalysisArtifactsByVideoId(videoId as string, { page, limit });
    res.status(200).json(result);
  } catch (error: any) {
    handleArtifactError(res, error);
  }
};

export const handleListAnalysisJobArtifacts = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const result = await listAnalysisArtifactsByJobId(jobId as string, { page, limit });
    res.status(200).json(result);
  } catch (error: any) {
    handleArtifactError(res, error);
  }
};

export const handleGetAnalysisArtifactSignedUrl = async (req: Request, res: Response) => {
  try {
    const { id: videoId, artifactId } = req.params;
    const result = await getAnalysisArtifactSignedDownloadUrl(videoId as string, artifactId as string, {
      expiresIn: 900,
    });
    res.status(200).json(result);
  } catch (error: any) {
    handleArtifactError(res, error);
  }
};
