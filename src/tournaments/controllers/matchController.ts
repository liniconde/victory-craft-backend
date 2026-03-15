import { Request, Response } from "express";
import {
  createMatch,
  deleteMatch,
  getMatchById,
  listMatches,
  updateMatch,
} from "../services/matchService";
import { handleTournamentsError } from "./common";

export const handleCreateMatch = async (req: Request, res: Response) => {
  try {
    const result = await createMatch(req.body || {});
    res.status(201).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleListMatches = async (req: Request, res: Response) => {
  try {
    const tournamentId =
      typeof req.query.tournamentId === "string" ? req.query.tournamentId : undefined;
    const teamId = typeof req.query.teamId === "string" ? req.query.teamId : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    const result = await listMatches({ tournamentId, teamId, status });
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleGetMatch = async (req: Request, res: Response) => {
  try {
    const result = await getMatchById(req.params.id as string);
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleUpdateMatch = async (req: Request, res: Response) => {
  try {
    const result = await updateMatch(req.params.id as string, req.body || {});
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleDeleteMatch = async (req: Request, res: Response) => {
  try {
    const result = await deleteMatch(req.params.id as string);
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};
