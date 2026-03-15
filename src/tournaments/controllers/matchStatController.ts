import { Request, Response } from "express";
import {
  createMatchStat,
  deleteMatchStat,
  getMatchStatById,
  listMatchStats,
  updateMatchStat,
} from "../services/matchStatService";
import { handleTournamentsError } from "./common";

export const handleCreateMatchStat = async (req: Request, res: Response) => {
  try {
    const result = await createMatchStat(req.body || {});
    res.status(201).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleListMatchStats = async (req: Request, res: Response) => {
  try {
    const tournamentId =
      typeof req.query.tournamentId === "string" ? req.query.tournamentId : undefined;
    const matchId = typeof req.query.matchId === "string" ? req.query.matchId : undefined;

    const result = await listMatchStats({ tournamentId, matchId });
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleGetMatchStat = async (req: Request, res: Response) => {
  try {
    const result = await getMatchStatById(req.params.id as string);
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleUpdateMatchStat = async (req: Request, res: Response) => {
  try {
    const result = await updateMatchStat(req.params.id as string, req.body || {});
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleDeleteMatchStat = async (req: Request, res: Response) => {
  try {
    const result = await deleteMatchStat(req.params.id as string);
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};
