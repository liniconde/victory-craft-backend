import mongoose from "mongoose";
import {
  CreateTournamentDto,
  UpdateTournamentDto,
} from "../contracts/tournamentContracts";
import Tournament from "../models/Tournament";
import TournamentTeam from "../models/TournamentTeam";
import TournamentPlayer from "../models/TournamentPlayer";
import TournamentMatch from "../models/TournamentMatch";
import TournamentMatchStat from "../models/TournamentMatchStat";
import { TournamentsDomainError } from "./errors";
import { assertObjectId, parseOptionalDate } from "./utils";

export const createTournament = async (payload: CreateTournamentDto) => {
  if (!payload.name?.trim()) {
    throw new TournamentsDomainError(400, "invalid_name", "name is required");
  }
  if (!payload.sport?.trim()) {
    throw new TournamentsDomainError(400, "invalid_sport", "sport is required");
  }
  if (payload.ownerId) {
    assertObjectId(payload.ownerId, "ownerId");
  }

  const tournament = await Tournament.create({
    name: payload.name.trim(),
    sport: payload.sport.trim().toLowerCase(),
    description: payload.description?.trim(),
    ownerId: payload.ownerId,
    startsAt: parseOptionalDate(payload.startsAt),
    endsAt: parseOptionalDate(payload.endsAt),
    status: payload.status || "draft",
  });

  return tournament.toObject();
};

export const listTournaments = async (filters?: { sport?: string; status?: string }) => {
  const query: any = {};

  if (filters?.sport?.trim()) {
    query.sport = filters.sport.trim().toLowerCase();
  }
  if (filters?.status?.trim()) {
    query.status = filters.status.trim();
  }

  const items = await Tournament.find(query).sort({ createdAt: -1, _id: -1 }).lean();
  return { items, total: items.length };
};

export const getTournamentById = async (id: string) => {
  assertObjectId(id, "tournamentId");

  const tournament = await Tournament.findById(id).lean();
  if (!tournament) {
    throw new TournamentsDomainError(404, "tournament_not_found", "Tournament not found");
  }

  return tournament;
};

export const updateTournament = async (id: string, payload: UpdateTournamentDto) => {
  assertObjectId(id, "tournamentId");

  const updatePayload: any = {
    ...payload,
  };

  if (typeof payload.name === "string") updatePayload.name = payload.name.trim();
  if (typeof payload.sport === "string") updatePayload.sport = payload.sport.trim().toLowerCase();
  if (typeof payload.description === "string") updatePayload.description = payload.description.trim();
  if (typeof payload.startsAt !== "undefined") updatePayload.startsAt = parseOptionalDate(payload.startsAt);
  if (typeof payload.endsAt !== "undefined") updatePayload.endsAt = parseOptionalDate(payload.endsAt);

  if (payload.ownerId) {
    assertObjectId(payload.ownerId, "ownerId");
  }

  const tournament = await Tournament.findByIdAndUpdate(id, updatePayload, { new: true }).lean();
  if (!tournament) {
    throw new TournamentsDomainError(404, "tournament_not_found", "Tournament not found");
  }

  return tournament;
};

export const deleteTournament = async (id: string) => {
  assertObjectId(id, "tournamentId");

  const tournament = await Tournament.findById(id).lean();
  if (!tournament) {
    throw new TournamentsDomainError(404, "tournament_not_found", "Tournament not found");
  }

  const tournamentObjectId = new mongoose.Types.ObjectId(id);

  const teams = await TournamentTeam.find({ tournamentId: tournamentObjectId }, { _id: 1 }).lean();
  const teamIds = teams.map((team) => team._id);

  const matches = teamIds.length
    ? await TournamentMatch.find(
        {
          homeTeamId: { $in: teamIds },
          awayTeamId: { $in: teamIds },
        },
        { _id: 1 },
      ).lean()
    : [];
  const matchIds = matches.map((match) => match._id);

  await Promise.all([
    Tournament.deleteOne({ _id: tournamentObjectId }),
    TournamentTeam.deleteMany({ tournamentId: tournamentObjectId }),
    teamIds.length ? TournamentPlayer.deleteMany({ teamId: { $in: teamIds } }) : Promise.resolve(),
    matchIds.length ? TournamentMatch.deleteMany({ _id: { $in: matchIds } }) : Promise.resolve(),
    matchIds.length ? TournamentMatchStat.deleteMany({ matchId: { $in: matchIds } }) : Promise.resolve(),
  ]);

  return {
    message: "Tournament deleted successfully",
    deletedTournamentId: id,
    deletedTeamsCount: teamIds.length,
    deletedMatchesCount: matchIds.length,
  };
};
