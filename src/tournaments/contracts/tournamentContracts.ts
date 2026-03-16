export type TournamentStatus = "draft" | "registration_open" | "in_progress" | "completed" | "cancelled";

export type MatchStatus = "scheduled" | "in_progress" | "finished" | "cancelled";

export type CreateTournamentDto = {
  name: string;
  sport: string;
  description?: string;
  ownerId?: string;
  startsAt?: string | Date;
  endsAt?: string | Date;
  status?: TournamentStatus;
};

export type UpdateTournamentDto = Partial<CreateTournamentDto>;

export type CreateTournamentTeamDto = {
  tournamentId: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
  coachName?: string;
};

export type UpdateTournamentTeamDto = Partial<Omit<CreateTournamentTeamDto, "tournamentId">>;

export type CreateTournamentPlayerDto = {
  teamId: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  position?: string;
  birthDate?: string | Date;
};

export type UpdateTournamentPlayerDto = Partial<Omit<CreateTournamentPlayerDto, "teamId">>;

export type CreateTournamentMatchDto = {
  homeTeamId: string;
  awayTeamId: string;
  fieldId?: string | null;
  scheduledAt?: string | Date;
  venue?: string;
  round?: string;
  status?: MatchStatus;
  matchSessionId?: string;
};

export type UpdateTournamentMatchDto = Partial<Omit<CreateTournamentMatchDto, "homeTeamId" | "awayTeamId">> & {
  score?: {
    home: number;
    away: number;
  };
  winnerTeamId?: string;
};

export type CreateTournamentMatchStatDto = {
  matchId: string;
  sport?: string;
  stats: Record<string, any>;
};

export type UpdateTournamentMatchStatDto = Partial<Omit<CreateTournamentMatchStatDto, "matchId">>;
