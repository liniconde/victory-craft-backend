import mongoose from "mongoose";
import {
  CreateTournamentMatchDto,
  UpdateTournamentMatchDto,
} from "../contracts/tournamentContracts";
import Tournament from "../models/Tournament";
import TournamentTeam from "../models/TournamentTeam";
import TournamentMatch from "../models/TournamentMatch";
import TournamentMatchStat from "../models/TournamentMatchStat";
import Field from "../../models/Field";
import { TournamentsDomainError } from "./errors";
import { assertObjectId, buildPairKey, parseOptionalDate } from "./utils";

const ensureTeamsForMatch = async (homeTeamId: string, awayTeamId: string) => {
  if (homeTeamId === awayTeamId) {
    throw new TournamentsDomainError(400, "same_team_match", "homeTeamId and awayTeamId must be different");
  }

  const [homeTeam, awayTeam] = await Promise.all([
    TournamentTeam.findById(homeTeamId).lean(),
    TournamentTeam.findById(awayTeamId).lean(),
  ]);

  if (!homeTeam || !awayTeam) {
    throw new TournamentsDomainError(404, "team_not_found", "One or both teams were not found");
  }

  if (String(homeTeam.tournamentId) !== String(awayTeam.tournamentId)) {
    throw new TournamentsDomainError(400, "cross_tournament_match", "Teams must belong to the same tournament");
  }

  return { homeTeam, awayTeam };
};

const ensureFieldExists = async (fieldId: string) => {
  assertObjectId(fieldId, "fieldId");

  const field = await Field.findById(fieldId).lean();
  if (!field) {
    throw new TournamentsDomainError(404, "field_not_found", "Field not found");
  }
};

export const createMatch = async (payload: CreateTournamentMatchDto) => {
  assertObjectId(payload.homeTeamId, "homeTeamId");
  assertObjectId(payload.awayTeamId, "awayTeamId");

  if (payload.matchSessionId) {
    assertObjectId(payload.matchSessionId, "matchSessionId");
  }
  if (typeof payload.fieldId === "string") {
    await ensureFieldExists(payload.fieldId);
  }

  await ensureTeamsForMatch(payload.homeTeamId, payload.awayTeamId);

  const pairKey = buildPairKey(payload.homeTeamId, payload.awayTeamId);

  const created = await TournamentMatch.create({
    homeTeamId: payload.homeTeamId,
    awayTeamId: payload.awayTeamId,
    fieldId: payload.fieldId || undefined,
    pairKey,
    scheduledAt: parseOptionalDate(payload.scheduledAt),
    venue: payload.venue?.trim(),
    round: payload.round?.trim(),
    status: payload.status || "scheduled",
    matchSessionId: payload.matchSessionId,
  });

  return created.toObject();
};

export const listMatches = async (filters?: {
  tournamentId?: string;
  teamId?: string;
  status?: string;
}) => {
  const query: any = {};

  if (filters?.teamId) {
    assertObjectId(filters.teamId, "teamId");
    query.$or = [{ homeTeamId: filters.teamId }, { awayTeamId: filters.teamId }];
  }

  if (filters?.tournamentId) {
    assertObjectId(filters.tournamentId, "tournamentId");
    const teams = await TournamentTeam.find({ tournamentId: filters.tournamentId }, { _id: 1 }).lean();
    const teamIds = teams.map((team) => team._id);

    if (query.$or) {
      const explicitTeamId = String(filters.teamId);
      const teamExistsInTournament = teamIds.some((teamId) => String(teamId) === explicitTeamId);
      if (!teamExistsInTournament) {
        return { items: [], total: 0 };
      }
    } else {
      query.homeTeamId = { $in: teamIds };
      query.awayTeamId = { $in: teamIds };
    }
  }

  if (filters?.status?.trim()) {
    query.status = filters.status.trim();
  }

  const items = await TournamentMatch.find(query).sort({ createdAt: -1, _id: -1 }).lean();
  return { items, total: items.length };
};

export const getMatchById = async (id: string) => {
  assertObjectId(id, "matchId");

  const match = await TournamentMatch.findById(id).lean();
  if (!match) {
    throw new TournamentsDomainError(404, "match_not_found", "Match not found");
  }

  return match;
};

export const updateMatch = async (id: string, payload: UpdateTournamentMatchDto) => {
  assertObjectId(id, "matchId");
  if (payload.matchSessionId) {
    assertObjectId(payload.matchSessionId, "matchSessionId");
  }
  if (payload.winnerTeamId) {
    assertObjectId(payload.winnerTeamId, "winnerTeamId");
  }
  if (typeof payload.fieldId === "string") {
    await ensureFieldExists(payload.fieldId);
  }

  const match = await TournamentMatch.findById(id);
  if (!match) {
    throw new TournamentsDomainError(404, "match_not_found", "Match not found");
  }

  if (payload.winnerTeamId) {
    const winner = payload.winnerTeamId;
    if (winner !== String(match.homeTeamId) && winner !== String(match.awayTeamId)) {
      throw new TournamentsDomainError(400, "invalid_winner", "winnerTeamId must belong to the match teams");
    }
  }

  if (typeof payload.scheduledAt !== "undefined") {
    match.scheduledAt = parseOptionalDate(payload.scheduledAt);
  }
  if (typeof payload.venue === "string") match.venue = payload.venue.trim();
  if (typeof payload.round === "string") match.round = payload.round.trim();
  if (typeof payload.status === "string") match.status = payload.status;
  if (typeof payload.fieldId !== "undefined") {
    match.fieldId =
      payload.fieldId === null ? undefined : new mongoose.Types.ObjectId(payload.fieldId as string);
  }
  if (payload.matchSessionId) match.matchSessionId = new mongoose.Types.ObjectId(payload.matchSessionId);
  if (payload.score) match.score = payload.score;
  if (payload.winnerTeamId) match.winnerTeamId = new mongoose.Types.ObjectId(payload.winnerTeamId);

  await match.save();
  return match.toObject();
};

export const deleteMatch = async (id: string) => {
  assertObjectId(id, "matchId");

  const matchObjectId = new mongoose.Types.ObjectId(id);
  const [deletedMatch, deletedStats] = await Promise.all([
    TournamentMatch.findByIdAndDelete(matchObjectId).lean(),
    TournamentMatchStat.deleteMany({ matchId: matchObjectId }),
  ]);

  if (!deletedMatch) {
    throw new TournamentsDomainError(404, "match_not_found", "Match not found");
  }

  return {
    message: "Match deleted successfully",
    deletedMatchId: id,
    deletedStatsCount: deletedStats.deletedCount || 0,
  };
};

export const generateMatchesForTournament = async (tournamentId: string) => {
  assertObjectId(tournamentId, "tournamentId");

  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) {
    throw new TournamentsDomainError(404, "tournament_not_found", "Tournament not found");
  }

  const teams = await TournamentTeam.find({ tournamentId }).sort({ createdAt: 1, _id: 1 }).lean();
  if (teams.length < 2) {
    throw new TournamentsDomainError(
      400,
      "insufficient_teams",
      "At least 2 teams are required to generate matches",
    );
  }

  const teamIds = teams.map((team) => team._id);
  const existing = await TournamentMatch.find(
    {
      homeTeamId: { $in: teamIds },
      awayTeamId: { $in: teamIds },
    },
    { pairKey: 1 },
  ).lean();
  const existingPairKeys = new Set(existing.map((row) => row.pairKey));

  const docsToCreate: Array<Record<string, any>> = [];
  let roundNumber = 1;

  for (let i = 0; i < teams.length; i += 1) {
    for (let j = i + 1; j < teams.length; j += 1) {
      const homeTeam = teams[i];
      const awayTeam = teams[j];
      const pairKey = buildPairKey(String(homeTeam._id), String(awayTeam._id));

      if (existingPairKeys.has(pairKey)) continue;

      docsToCreate.push({
        homeTeamId: homeTeam._id,
        awayTeamId: awayTeam._id,
        pairKey,
        round: `round-${roundNumber}`,
        status: "scheduled",
      });

      roundNumber += 1;
    }
  }

  let createdCount = 0;
  if (docsToCreate.length > 0) {
    const inserted = await TournamentMatch.insertMany(docsToCreate, { ordered: false });
    createdCount = inserted.length;
  }

  return {
    tournamentId,
    teamsCount: teams.length,
    existingMatches: existing.length,
    createdMatches: createdCount,
    totalMatchesAfterGeneration: existing.length + createdCount,
  };
};
