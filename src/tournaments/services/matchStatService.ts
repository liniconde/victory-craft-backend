import {
  CreateTournamentMatchStatDto,
  UpdateTournamentMatchStatDto,
} from "../contracts/tournamentContracts";
import TournamentTeam from "../models/TournamentTeam";
import TournamentMatch from "../models/TournamentMatch";
import TournamentMatchStat from "../models/TournamentMatchStat";
import { TournamentsDomainError } from "./errors";
import { assertObjectId } from "./utils";

export const createMatchStat = async (payload: CreateTournamentMatchStatDto) => {
  assertObjectId(payload.matchId, "matchId");

  const match = await TournamentMatch.findById(payload.matchId).lean();
  if (!match) {
    throw new TournamentsDomainError(404, "match_not_found", "Match not found");
  }

  const created = await TournamentMatchStat.create({
    matchId: payload.matchId,
    sport: payload.sport?.trim().toLowerCase(),
    stats: payload.stats || {},
  });

  return created.toObject();
};

export const listMatchStats = async (filters?: { tournamentId?: string; matchId?: string }) => {
  const query: any = {};

  if (filters?.matchId) {
    assertObjectId(filters.matchId, "matchId");
    query.matchId = filters.matchId;
  }

  if (filters?.tournamentId) {
    assertObjectId(filters.tournamentId, "tournamentId");
    const teams = await TournamentTeam.find({ tournamentId: filters.tournamentId }, { _id: 1 }).lean();
    const teamIds = teams.map((team) => team._id);

    if (query.matchId) {
      const match = await TournamentMatch.findById(query.matchId, { homeTeamId: 1, awayTeamId: 1 }).lean();
      const isInTournament =
        !!match &&
        teamIds.some((teamId) => String(teamId) === String(match.homeTeamId)) &&
        teamIds.some((teamId) => String(teamId) === String(match.awayTeamId));

      if (!isInTournament) {
        return { items: [], total: 0 };
      }
    } else {
      const matches = await TournamentMatch.find(
        {
          homeTeamId: { $in: teamIds },
          awayTeamId: { $in: teamIds },
        },
        { _id: 1 },
      ).lean();
      const matchIds = matches.map((match) => match._id);
      query.matchId = { $in: matchIds };
    }
  }

  const items = await TournamentMatchStat.find(query).sort({ createdAt: -1, _id: -1 }).lean();
  return { items, total: items.length };
};

export const getMatchStatById = async (id: string) => {
  assertObjectId(id, "matchStatId");

  const stat = await TournamentMatchStat.findById(id).lean();
  if (!stat) {
    throw new TournamentsDomainError(404, "match_stat_not_found", "Match stat not found");
  }

  return stat;
};

export const updateMatchStat = async (id: string, payload: UpdateTournamentMatchStatDto) => {
  assertObjectId(id, "matchStatId");

  const updatePayload: any = { ...payload };
  if (typeof payload.sport === "string") updatePayload.sport = payload.sport.trim().toLowerCase();

  const stat = await TournamentMatchStat.findByIdAndUpdate(id, updatePayload, { new: true }).lean();
  if (!stat) {
    throw new TournamentsDomainError(404, "match_stat_not_found", "Match stat not found");
  }

  return stat;
};

export const deleteMatchStat = async (id: string) => {
  assertObjectId(id, "matchStatId");

  const deleted = await TournamentMatchStat.findByIdAndDelete(id).lean();
  if (!deleted) {
    throw new TournamentsDomainError(404, "match_stat_not_found", "Match stat not found");
  }

  return { message: "Match stat deleted successfully", deletedMatchStatId: id };
};
