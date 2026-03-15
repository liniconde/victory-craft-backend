import {
  CreateTournamentPlayerDto,
  UpdateTournamentPlayerDto,
} from "../contracts/tournamentContracts";
import TournamentTeam from "../models/TournamentTeam";
import TournamentPlayer from "../models/TournamentPlayer";
import { TournamentsDomainError } from "./errors";
import { assertObjectId, parseOptionalDate } from "./utils";

export const createPlayer = async (payload: CreateTournamentPlayerDto) => {
  assertObjectId(payload.teamId, "teamId");

  if (!payload.firstName?.trim() || !payload.lastName?.trim()) {
    throw new TournamentsDomainError(400, "invalid_name", "firstName and lastName are required");
  }

  const team = await TournamentTeam.findById(payload.teamId).lean();
  if (!team) {
    throw new TournamentsDomainError(404, "team_not_found", "Team not found");
  }

  const player = await TournamentPlayer.create({
    teamId: payload.teamId,
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    jerseyNumber: payload.jerseyNumber,
    position: payload.position?.trim(),
    birthDate: parseOptionalDate(payload.birthDate),
  });

  return player.toObject();
};

export const listPlayers = async (filters?: { tournamentId?: string; teamId?: string }) => {
  const query: any = {};

  if (filters?.teamId) {
    assertObjectId(filters.teamId, "teamId");
    query.teamId = filters.teamId;
  }

  if (filters?.tournamentId) {
    assertObjectId(filters.tournamentId, "tournamentId");
    const teams = await TournamentTeam.find({ tournamentId: filters.tournamentId }, { _id: 1 }).lean();
    const teamIds = teams.map((team) => team._id);
    query.teamId = query.teamId
      ? { $in: teamIds.filter((teamId) => String(teamId) === String(query.teamId)) }
      : { $in: teamIds };
  }

  const items = await TournamentPlayer.find(query).sort({ createdAt: 1, _id: 1 }).lean();
  return { items, total: items.length };
};

export const getPlayerById = async (id: string) => {
  assertObjectId(id, "playerId");

  const player = await TournamentPlayer.findById(id).lean();
  if (!player) {
    throw new TournamentsDomainError(404, "player_not_found", "Player not found");
  }

  return player;
};

export const updatePlayer = async (id: string, payload: UpdateTournamentPlayerDto) => {
  assertObjectId(id, "playerId");

  const updatePayload: any = { ...payload };
  if (typeof payload.firstName === "string") updatePayload.firstName = payload.firstName.trim();
  if (typeof payload.lastName === "string") updatePayload.lastName = payload.lastName.trim();
  if (typeof payload.position === "string") updatePayload.position = payload.position.trim();
  if (typeof payload.birthDate !== "undefined") updatePayload.birthDate = parseOptionalDate(payload.birthDate);

  const player = await TournamentPlayer.findByIdAndUpdate(id, updatePayload, { new: true }).lean();
  if (!player) {
    throw new TournamentsDomainError(404, "player_not_found", "Player not found");
  }

  return player;
};

export const deletePlayer = async (id: string) => {
  assertObjectId(id, "playerId");

  const deleted = await TournamentPlayer.findByIdAndDelete(id).lean();
  if (!deleted) {
    throw new TournamentsDomainError(404, "player_not_found", "Player not found");
  }

  return { message: "Player deleted successfully", deletedPlayerId: id };
};
