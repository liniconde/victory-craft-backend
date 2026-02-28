import mongoose from "mongoose";
import VideoStats from "../models/VideoStats";
import Video from "../models/Video";

type SportType = "football" | "padel" | "tennis" | "basketball" | "other";
type EventType = "pass" | "shot" | "goal" | "foul" | "other";
type TeamKey = "A" | "B";

type ManualEventInput = {
  id: string;
  time: number;
  type: EventType;
  team: TeamKey;
  note?: string;
};

type MatchMetric = {
  total: number;
  teamA: number;
  teamB: number;
};

type UnifiedStats = {
  passes: MatchMetric;
  shots: MatchMetric;
  goals: MatchMetric;
  fouls: MatchMetric;
  others: MatchMetric;
};

type UpsertPayload = {
  videoId: string;
  sportType?: SportType;
  teamAName?: string;
  teamBName?: string;
  events?: ManualEventInput[];
  teams?: Array<{ teamKey?: TeamKey; teamName: string; stats: Record<string, number> }>;
  matchStats?: UnifiedStats;
  summary?: string;
  generatedByModel?:
    | "manual"
    | "OpenPose"
    | "YOLOv8"
    | "DeepSportAnalyzer"
    | "BallTrackNet"
    | "Gemini-2.0-Flash"
    | "custom";
  statistics?: {
    sportType?: SportType;
    teams?: Array<{ teamName: string; stats: Record<string, number> }>;
    summary?: string;
    matchStats?: UnifiedStats;
    events?: ManualEventInput[];
    teamAName?: string;
    teamBName?: string;
  };
};

export class VideoStatsServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const SPORT_TYPES: SportType[] = ["football", "padel", "tennis", "basketball", "other"];
const EVENT_TYPES: EventType[] = ["pass", "shot", "goal", "foul", "other"];
const TEAM_KEYS: TeamKey[] = ["A", "B"];

const emptyMetric = (): MatchMetric => ({ total: 0, teamA: 0, teamB: 0 });

const safeTrim = (value?: string) => (typeof value === "string" ? value.trim() : "");

const isValidSportType = (value: any): value is SportType => SPORT_TYPES.includes(value);

const buildResponse = (stats: any) => {
  const result = stats?.toObject ? stats.toObject() : stats;
  return {
    ...result,
    statistics: {
      sportType: result.sportType,
      teams: result.teams || [],
      summary: result.summary || "",
      matchStats: result.matchStats,
      events: result.events || [],
      teamAName: result.teamAName,
      teamBName: result.teamBName,
    },
  };
};

const normalizeFromLegacyOrUnified = (payload: UpsertPayload) => {
  const normalized = {
    videoId: payload.videoId,
    sportType: (payload.sportType || payload.statistics?.sportType) as SportType | undefined,
    teamAName: safeTrim(payload.teamAName || payload.statistics?.teamAName),
    teamBName: safeTrim(payload.teamBName || payload.statistics?.teamBName),
    events: (payload.events || payload.statistics?.events || []) as ManualEventInput[],
    teams:
      payload.teams ||
      payload.statistics?.teams ||
      ([] as Array<{ teamName: string; stats: Record<string, number> }>),
    matchStats: (payload.matchStats || payload.statistics?.matchStats) as UnifiedStats | undefined,
    summary: payload.summary || payload.statistics?.summary || "",
    generatedByModel: payload.generatedByModel || "manual",
  };

  return normalized;
};

const validateEvents = (events: ManualEventInput[]) => {
  if (!Array.isArray(events)) {
    throw new VideoStatsServiceError(400, "invalid_events", "events must be an array");
  }

  events.forEach((event, index) => {
    if (!event.id || typeof event.id !== "string") {
      throw new VideoStatsServiceError(400, "invalid_event_id", `events[${index}].id is required`);
    }
    if (typeof event.time !== "number" || Number.isNaN(event.time) || event.time < 0) {
      throw new VideoStatsServiceError(
        400,
        "invalid_event_time",
        `events[${index}].time must be a number >= 0`,
      );
    }
    if (!EVENT_TYPES.includes(event.type)) {
      throw new VideoStatsServiceError(
        400,
        "invalid_event_type",
        `events[${index}].type is invalid`,
      );
    }
    if (!TEAM_KEYS.includes(event.team)) {
      throw new VideoStatsServiceError(
        400,
        "invalid_event_team",
        `events[${index}].team must be A or B`,
      );
    }
    if (event.note !== undefined && (typeof event.note !== "string" || event.note.length > 500)) {
      throw new VideoStatsServiceError(
        400,
        "invalid_event_note",
        `events[${index}].note must be <= 500 chars`,
      );
    }
  });
};

export const calculateStatsFromEvents = (events: ManualEventInput[]): UnifiedStats => {
  const stats: UnifiedStats = {
    passes: emptyMetric(),
    shots: emptyMetric(),
    goals: emptyMetric(),
    fouls: emptyMetric(),
    others: emptyMetric(),
  };

  const add = (metric: MatchMetric, team: TeamKey) => {
    metric.total += 1;
    if (team === "A") metric.teamA += 1;
    if (team === "B") metric.teamB += 1;
  };

  events.forEach((event) => {
    if (event.type === "pass") add(stats.passes, event.team);
    if (event.type === "shot") add(stats.shots, event.team);
    if (event.type === "goal") {
      add(stats.goals, event.team);
      // Rule: each goal is also a shot.
      add(stats.shots, event.team);
    }
    if (event.type === "foul") add(stats.fouls, event.team);
    if (event.type === "other") add(stats.others, event.team);
  });

  return stats;
};

const deriveMatchStatsFromTeams = (teams: Array<{ teamName: string; stats: Record<string, number> }>) => {
  const safe = (value: any) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
  const a = teams[0]?.stats || {};
  const b = teams[1]?.stats || {};

  const passesA = safe(a.passes);
  const passesB = safe(b.passes);
  const shotsA = safe(a.shots);
  const shotsB = safe(b.shots);
  const goalsA = safe(a.goals);
  const goalsB = safe(b.goals);
  const foulsA = safe(a.fouls);
  const foulsB = safe(b.fouls);
  const othersA = safe(a.others);
  const othersB = safe(b.others);

  return {
    passes: { total: passesA + passesB, teamA: passesA, teamB: passesB },
    shots: { total: shotsA + shotsB, teamA: shotsA, teamB: shotsB },
    goals: { total: goalsA + goalsB, teamA: goalsA, teamB: goalsB },
    fouls: { total: foulsA + foulsB, teamA: foulsA, teamB: foulsB },
    others: { total: othersA + othersB, teamA: othersA, teamB: othersB },
  };
};

const buildTeamsFromEventStats = (
  teamAName: string,
  teamBName: string,
  calculated: UnifiedStats,
) => [
  {
    teamKey: "A",
    teamName: teamAName,
      stats: {
        passes: calculated.passes.teamA,
        shots: calculated.shots.teamA,
        goals: calculated.goals.teamA,
        fouls: calculated.fouls.teamA,
        others: calculated.others.teamA,
      },
  },
  {
    teamKey: "B",
    teamName: teamBName,
      stats: {
        passes: calculated.passes.teamB,
        shots: calculated.shots.teamB,
        goals: calculated.goals.teamB,
        fouls: calculated.fouls.teamB,
        others: calculated.others.teamB,
      },
  },
];

const ensureValidBase = (videoId: string, sportType?: SportType) => {
  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new VideoStatsServiceError(400, "invalid_video_id", "videoId is required and must be valid");
  }

  if (!sportType || !isValidSportType(sportType)) {
    throw new VideoStatsServiceError(400, "invalid_sport_type", "sportType is required and invalid");
  }
};

const buildUpsertDocument = (payload: UpsertPayload) => {
  const normalized = normalizeFromLegacyOrUnified(payload);
  ensureValidBase(normalized.videoId, normalized.sportType);

  const hasEvents = Array.isArray(normalized.events);
  const events = hasEvents ? normalized.events : [];
  if (hasEvents) validateEvents(events);

  let matchStats = normalized.matchStats;
  let teams = normalized.teams || [];
  const teamAName = normalized.teamAName || teams[0]?.teamName || "Team A";
  const teamBName = normalized.teamBName || teams[1]?.teamName || "Team B";

  if (events.length >= 0 && (normalized.teamAName || normalized.teamBName || events.length > 0)) {
    // If events are present in the request path (manual mode), always recalculate.
    if (events.length > 0 || normalized.generatedByModel === "manual") {
      const calculated = calculateStatsFromEvents(events);
      matchStats = calculated;
      teams = buildTeamsFromEventStats(teamAName, teamBName, calculated);
    }
  }

  if (!matchStats && teams.length > 0) {
    matchStats = deriveMatchStatsFromTeams(teams as Array<{ teamName: string; stats: Record<string, number> }>);
  }

  return {
    videoId: normalized.videoId,
    sportType: normalized.sportType,
    teamAName,
    teamBName,
    teams,
    matchStats,
    events: events.length ? events : undefined,
    summary: normalized.summary || "",
    generatedByModel: normalized.generatedByModel || "manual",
  };
};

const ensureVideoExistsAndSyncSportType = async (videoId: string, sportType: SportType) => {
  const exists = await Video.exists({ _id: videoId });
  if (!exists) {
    throw new VideoStatsServiceError(404, "video_not_found", "Video not found");
  }
  await Video.findByIdAndUpdate(videoId, { sportType });
};

export const createVideoStats = async (statsData: UpsertPayload) => {
  try {
    const upsertDoc = buildUpsertDocument(statsData);
    await ensureVideoExistsAndSyncSportType(upsertDoc.videoId, upsertDoc.sportType as SportType);

    const created = await VideoStats.findOneAndUpdate(
      { videoId: upsertDoc.videoId },
      upsertDoc,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return buildResponse(created);
  } catch (error: any) {
    if (error instanceof VideoStatsServiceError) throw error;
    throw new Error(`Error creating video stats: ${error.message}`);
  }
};

export const getVideoStatsByVideoId = async (videoId: string) => {
  try {
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
      throw new VideoStatsServiceError(400, "invalid_video_id", "videoId is required and must be valid");
    }

    const stats = await VideoStats.findOne({ videoId });
    if (!stats) {
      throw new VideoStatsServiceError(404, "stats_not_found", "Stats not found for this video");
    }
    return buildResponse(stats);
  } catch (error: any) {
    if (error instanceof VideoStatsServiceError) throw error;
    throw new Error(`Error fetching video stats: ${error.message}`);
  }
};

export const updateVideoStats = async (videoId: string, updateData: UpsertPayload) => {
  try {
    const upsertDoc = buildUpsertDocument({ ...updateData, videoId });
    await ensureVideoExistsAndSyncSportType(upsertDoc.videoId, upsertDoc.sportType as SportType);

    const updated = await VideoStats.findOneAndUpdate({ videoId }, upsertDoc, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    return buildResponse(updated);
  } catch (error: any) {
    if (error instanceof VideoStatsServiceError) throw error;
    throw new Error(`Error updating video stats: ${error.message}`);
  }
};

export const deleteVideoStats = async (videoId: string) => {
  try {
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
      throw new VideoStatsServiceError(400, "invalid_video_id", "videoId is required and must be valid");
    }
    const deleted = await VideoStats.findOneAndDelete({ videoId });
    if (!deleted) throw new VideoStatsServiceError(404, "stats_not_found", "Stats not found to delete");
    return { message: "Video stats deleted successfully" };
  } catch (error: any) {
    if (error instanceof VideoStatsServiceError) throw error;
    throw new Error(`Error deleting video stats: ${error.message}`);
  }
};
