import { Request, Response } from "express";
import {
  PlayerProfileServiceError,
  createPlayerProfile,
  getMyPlayerProfile,
  getPlayerProfileById,
  getPlayerProfilesCatalog,
  linkVideoToPlayerProfile,
  listPlayerProfileVideos,
  listPlayerProfiles,
  unlinkVideoFromPlayerProfile,
  updatePlayerProfile,
} from "../application/playerProfileService";

const handleError = (res: Response, error: any) => {
  if (error instanceof PlayerProfileServiceError) {
    res.status(error.status).json({ message: error.message, code: error.code });
    return;
  }

  console.error(
    JSON.stringify({
      event: "player_profile_controller_error",
      message: error?.message || "Unknown error",
    }),
  );

  res.status(500).json({ message: "Internal server error", code: "player_profile_internal_error" });
};

export const handleGetMyPlayerProfile = async (req: Request, res: Response) => {
  try {
    const result = await getMyPlayerProfile((req as any).user);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleCreatePlayerProfile = async (req: Request, res: Response) => {
  try {
    const result = await createPlayerProfile(req.body || {}, (req as any).user);
    res.status(201).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleListPlayerProfiles = async (req: Request, res: Response) => {
  try {
    const result = await listPlayerProfiles(req.query || {}, (req as any).user);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleGetPlayerProfileById = async (req: Request, res: Response) => {
  try {
    const result = await getPlayerProfileById(req.params.profileId as string, (req as any).user);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleUpdatePlayerProfile = async (req: Request, res: Response) => {
  try {
    const result = await updatePlayerProfile(req.params.profileId as string, req.body || {}, (req as any).user);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleLinkVideoToPlayerProfile = async (req: Request, res: Response) => {
  try {
    const result = await linkVideoToPlayerProfile(req.params.profileId as string, req.body || {}, (req as any).user);
    res.status(201).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleListPlayerProfileVideos = async (req: Request, res: Response) => {
  try {
    const result = await listPlayerProfileVideos(req.params.profileId as string, req.query || {}, (req as any).user);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleUnlinkVideoFromPlayerProfile = async (req: Request, res: Response) => {
  try {
    const result = await unlinkVideoFromPlayerProfile(
      req.params.profileId as string,
      req.params.videoId as string,
      (req as any).user,
    );
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};

export const handleGetPlayerProfilesCatalog = async (req: Request, res: Response) => {
  try {
    const result = await getPlayerProfilesCatalog((req as any).user);
    res.status(200).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
};
