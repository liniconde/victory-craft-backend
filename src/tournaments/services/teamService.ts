import mongoose from "mongoose";
import {
  CreateTournamentTeamDto,
  UpdateTournamentTeamDto,
} from "../contracts/tournamentContracts";
import Tournament from "../models/Tournament";
import TournamentTeam from "../models/TournamentTeam";
import TournamentPlayer from "../models/TournamentPlayer";
import TournamentMatch from "../models/TournamentMatch";
import TournamentMatchStat from "../models/TournamentMatchStat";
import { TournamentsDomainError } from "./errors";
import { assertObjectId } from "./utils";

export const createTeam = async (payload: CreateTournamentTeamDto) => {
  assertObjectId(payload.tournamentId, "tournamentId");

  if (!payload.name?.trim()) {
    throw new TournamentsDomainError(400, "invalid_name", "name is required");
  }

  const tournament = await Tournament.findById(payload.tournamentId).lean();
  if (!tournament) {
    throw new TournamentsDomainError(404, "tournament_not_found", "Tournament not found");
  }

  const team = await TournamentTeam.create({
    tournamentId: payload.tournamentId,
    name: payload.name.trim(),
    shortName: payload.shortName?.trim(),
    logoUrl: payload.logoUrl?.trim(),
    coachName: payload.coachName?.trim(),
  });

  return team.toObject();
};

export const listTeams = async (filters?: { tournamentId?: string }) => {
  const query: any = {};
  if (filters?.tournamentId) {
    assertObjectId(filters.tournamentId, "tournamentId");
    query.tournamentId = filters.tournamentId;
  }

  const items = await TournamentTeam.find(query).sort({ createdAt: 1, _id: 1 }).lean();
  return { items, total: items.length };
};

export const getTeamById = async (id: string) => {
  assertObjectId(id, "teamId");

  const team = await TournamentTeam.findById(id).lean();
  if (!team) {
    throw new TournamentsDomainError(404, "team_not_found", "Team not found");
  }

  return team;
};

export const updateTeam = async (id: string, payload: UpdateTournamentTeamDto) => {
  assertObjectId(id, "teamId");

  const updatePayload: any = { ...payload };
  if (typeof payload.name === "string") updatePayload.name = payload.name.trim();
  if (typeof payload.shortName === "string") updatePayload.shortName = payload.shortName.trim();
  if (typeof payload.logoUrl === "string") updatePayload.logoUrl = payload.logoUrl.trim();
  if (typeof payload.coachName === "string") updatePayload.coachName = payload.coachName.trim();

  const team = await TournamentTeam.findByIdAndUpdate(id, updatePayload, { new: true }).lean();
  if (!team) {
    throw new TournamentsDomainError(404, "team_not_found", "Team not found");
  }

  return team;
};

export const deleteTeam = async (id: string) => {
  assertObjectId(id, "teamId");

  const team = await TournamentTeam.findById(id).lean();
  if (!team) {
    throw new TournamentsDomainError(404, "team_not_found", "Team not found");
  }

  const teamObjectId = new mongoose.Types.ObjectId(id);
  const [matchesAsHome, matchesAsAway] = await Promise.all([
    TournamentMatch.find({ homeTeamId: teamObjectId }, { _id: 1 }).lean(),
    TournamentMatch.find({ awayTeamId: teamObjectId }, { _id: 1 }).lean(),
  ]);

  const matchIdsSet = new Set([...matchesAsHome, ...matchesAsAway].map((match) => String(match._id)));
  const matchIds = [...matchIdsSet].map((matchId) => new mongoose.Types.ObjectId(matchId));

  await Promise.all([
    TournamentTeam.deleteOne({ _id: teamObjectId }),
    TournamentPlayer.deleteMany({ teamId: teamObjectId }),
    matchIds.length ? TournamentMatch.deleteMany({ _id: { $in: matchIds } }) : Promise.resolve(),
    matchIds.length ? TournamentMatchStat.deleteMany({ matchId: { $in: matchIds } }) : Promise.resolve(),
  ]);

  return {
    message: "Team deleted successfully",
    deletedTeamId: id,
    deletedMatchesCount: matchIds.length,
  };
};
