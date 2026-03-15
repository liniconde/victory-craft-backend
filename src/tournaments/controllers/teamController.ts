import { Request, Response } from "express";
import {
  createTeam,
  deleteTeam,
  getTeamById,
  listTeams,
  updateTeam,
} from "../services/teamService";
import { handleTournamentsError } from "./common";

export const handleCreateTeam = async (req: Request, res: Response) => {
  try {
    const result = await createTeam(req.body || {});
    res.status(201).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleListTeams = async (req: Request, res: Response) => {
  try {
    const tournamentId =
      typeof req.query.tournamentId === "string" ? req.query.tournamentId : undefined;

    const result = await listTeams({ tournamentId });
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleGetTeam = async (req: Request, res: Response) => {
  try {
    const result = await getTeamById(req.params.id as string);
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleUpdateTeam = async (req: Request, res: Response) => {
  try {
    const result = await updateTeam(req.params.id as string, req.body || {});
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleDeleteTeam = async (req: Request, res: Response) => {
  try {
    const result = await deleteTeam(req.params.id as string);
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};
