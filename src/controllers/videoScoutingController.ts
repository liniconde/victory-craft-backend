import { Request, Response } from "express";
import {
  VideoScoutingServiceError,
  createVideoScoutingProfile,
  deleteVideoVoteByUser,
  getTopVideoLibraryRankings,
  getVideoLibraryFiltersCatalog,
  getVideoLibraryRankings,
  getVideoRecruiterView,
  getVideoScoutingProfile,
  getVideoVoteSummary,
  updateVideoScoutingProfile,
  upsertVideoVote,
} from "../services/videoScoutingService";

const handleError = (res: Response, error: any) => {
  if (error instanceof VideoScoutingServiceError) {
    res.status(error.status).json({ message: error.message, code: error.code });
    return;
  }

  console.error(
    JSON.stringify({
      event: "video_scouting_controller_error",
      message: error?.message || "Unknown error",
    }),
  );

  res.status(500).json({ message: "Internal server error", code: "video_scouting_internal_error" });
};

export const handleCreateVideoScoutingProfile = async (req: Request, res: Response) => {
  try {
    const result = await createVideoScoutingProfile(req.params.videoId as string, req.body || {}, (req as any).user);
    res.status(201).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleGetVideoScoutingProfile = async (req: Request, res: Response) => {
  try {
    const result = await getVideoScoutingProfile(req.params.videoId as string);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleUpdateVideoScoutingProfile = async (req: Request, res: Response) => {
  try {
    const result = await updateVideoScoutingProfile(req.params.videoId as string, req.body || {}, (req as any).user);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleUpsertVideoVote = async (req: Request, res: Response) => {
  try {
    const result = await upsertVideoVote(req.params.videoId as string, req.body || {}, (req as any).user);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleDeleteMyVideoVote = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const result = await deleteVideoVoteByUser(req.params.videoId as string, userId, (req as any).user);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleDeleteVideoVoteByUser = async (req: Request, res: Response) => {
  try {
    const result = await deleteVideoVoteByUser(
      req.params.videoId as string,
      req.params.userId as string,
      (req as any).user,
    );
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleGetVideoVoteSummary = async (req: Request, res: Response) => {
  try {
    const result = await getVideoVoteSummary(req.params.videoId as string, (req as any).user?.id);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleGetVideoLibraryRankings = async (req: Request, res: Response) => {
  try {
    const result = await getVideoLibraryRankings(req.query || {}, (req as any).user?.id);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleGetTopVideoLibraryRankings = async (req: Request, res: Response) => {
  try {
    const result = await getTopVideoLibraryRankings(req.query || {}, (req as any).user?.id);
    res.status(200).json({ items: result });
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleGetVideoLibraryFiltersCatalog = async (_req: Request, res: Response) => {
  try {
    const result = await getVideoLibraryFiltersCatalog();
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleGetVideoRecruiterView = async (req: Request, res: Response) => {
  try {
    const result = await getVideoRecruiterView(req.params.videoId as string, (req as any).user?.id);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};
