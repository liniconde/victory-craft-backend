import { Request, Response } from "express";
import {
  createPlayer,
  deletePlayer,
  getPlayerById,
  listPlayers,
  updatePlayer,
} from "../services/playerService";
import { handleTournamentsError } from "./common";

export const handleCreatePlayer = async (req: Request, res: Response) => {
  try {
    const result = await createPlayer(req.body || {});
    res.status(201).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleListPlayers = async (req: Request, res: Response) => {
  try {
    const tournamentId =
      typeof req.query.tournamentId === "string" ? req.query.tournamentId : undefined;
    const teamId = typeof req.query.teamId === "string" ? req.query.teamId : undefined;

    const result = await listPlayers({ tournamentId, teamId });
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleGetPlayer = async (req: Request, res: Response) => {
  try {
    const result = await getPlayerById(req.params.id as string);
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleUpdatePlayer = async (req: Request, res: Response) => {
  try {
    const result = await updatePlayer(req.params.id as string, req.body || {});
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleDeletePlayer = async (req: Request, res: Response) => {
  try {
    const result = await deletePlayer(req.params.id as string);
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};
