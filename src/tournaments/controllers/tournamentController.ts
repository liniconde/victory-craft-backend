import { Request, Response } from "express";
import {
  createTournament,
  deleteTournament,
  getTournamentById,
  listTournaments,
  updateTournament,
} from "../services/tournamentService";
import { generateMatchesForTournament } from "../services/matchService";
import { handleTournamentsError } from "./common";

export const handleCreateTournament = async (req: Request, res: Response) => {
  try {
    const result = await createTournament(req.body || {});
    res.status(201).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleListTournaments = async (req: Request, res: Response) => {
  try {
    const sport = typeof req.query.sport === "string" ? req.query.sport : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    const result = await listTournaments({ sport, status });
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleGetTournament = async (req: Request, res: Response) => {
  try {
    const result = await getTournamentById(req.params.id as string);
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleUpdateTournament = async (req: Request, res: Response) => {
  try {
    const result = await updateTournament(req.params.id as string, req.body || {});
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleDeleteTournament = async (req: Request, res: Response) => {
  try {
    const result = await deleteTournament(req.params.id as string);
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};

export const handleGenerateTournamentMatches = async (req: Request, res: Response) => {
  try {
    const result = await generateMatchesForTournament(req.params.id as string);
    res.status(200).json(result);
  } catch (error: any) {
    handleTournamentsError(res, error);
  }
};
