import { z } from "zod";

const optionalTrimmedString = z.string().trim().min(1).optional();
const coerceBooleanFromQuery = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return value;
}, z.boolean());

export const scoutingProfileBaseSchema = z.object({
  playerProfileId: z.string().trim().optional(),
  title: optionalTrimmedString,
  sportType: optionalTrimmedString,
  playType: optionalTrimmedString,
  tournamentType: optionalTrimmedString,
  playerName: optionalTrimmedString,
  playerAge: z.number().int().min(0).max(100).optional(),
  playerPosition: optionalTrimmedString,
  playerTeam: optionalTrimmedString,
  playerCategory: optionalTrimmedString,
  jerseyNumber: z.number().int().min(0).max(99).optional(),
  dominantProfile: optionalTrimmedString,
  country: optionalTrimmedString,
  city: optionalTrimmedString,
  tournamentName: optionalTrimmedString,
  notes: z.string().trim().max(5000).optional(),
  tags: z.array(z.string().trim().min(1)).max(100).optional(),
  recordedAt: z.string().datetime({ offset: true }).optional(),
});

export const createScoutingProfileSchema = scoutingProfileBaseSchema.refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one scouting profile field is required" },
);

export const updateScoutingProfileSchema = scoutingProfileBaseSchema;

export const upsertVideoVoteSchema = z.object({
  value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});

export const rankingsQuerySchema = z.object({
  sportType: z.string().trim().optional(),
  playType: z.string().trim().optional(),
  country: z.string().trim().optional(),
  city: z.string().trim().optional(),
  tournamentType: z.string().trim().optional(),
  playerPosition: z.string().trim().optional(),
  playerCategory: z.string().trim().optional(),
  tournamentName: z.string().trim().optional(),
  searchTerm: z.string().trim().optional(),
  sortBy: z.enum(["score", "recent", "upvotes"]).optional().default("score"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  includeWithoutProfile: coerceBooleanFromQuery.optional().default(false),
});

export const topRankingsQuerySchema = z.object({
  sportType: z.string().trim().optional(),
  playType: z.string().trim().optional(),
  country: z.string().trim().optional(),
  city: z.string().trim().optional(),
  tournamentType: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  includeWithoutProfile: coerceBooleanFromQuery.optional().default(false),
});

export type CreateScoutingProfileDto = z.infer<typeof createScoutingProfileSchema>;
export type UpdateScoutingProfileDto = z.infer<typeof updateScoutingProfileSchema>;
export type UpsertVideoVoteDto = z.infer<typeof upsertVideoVoteSchema>;
export type RankingsQueryDto = z.infer<typeof rankingsQuerySchema>;
export type TopRankingsQueryDto = z.infer<typeof topRankingsQuerySchema>;
