import { z } from "zod";
import { normalizeSportType, SPORT_TYPES } from "../../shared/sportTypes";

const requiredTrimmedString = z.string().trim().min(1);
const optionalTrimmedString = requiredTrimmedString.optional();
const optionalSportType = z.preprocess(
  (value) => {
    const normalized = normalizeSportType(value);
    if (normalized) return normalized;
    return value;
  },
  z.enum(SPORT_TYPES).optional(),
);
const requiredSportType = z.preprocess(
  (value) => {
    const normalized = normalizeSportType(value);
    if (normalized) return normalized;
    return value;
  },
  z.enum(SPORT_TYPES),
);

const scoutingProfileEditorialFieldsSchema = z.object({
  publicationStatus: z.enum(["draft", "published", "archived"]).optional(),
  title: optionalTrimmedString,
  sportType: optionalSportType,
  playType: optionalTrimmedString,
  tournamentType: optionalTrimmedString,
  playerAge: z.number().int().min(0).max(100).optional(),
  jerseyNumber: z.number().int().min(0).max(99).optional(),
  tournamentName: optionalTrimmedString,
  notes: z.string().trim().max(5000).optional(),
  tags: z.array(z.string().trim().min(1)).max(100).optional(),
  recordedAt: z.string().datetime({ offset: true }).optional(),
});

export const createScoutingProfileSchema = scoutingProfileEditorialFieldsSchema.extend({
  playerProfileId: requiredTrimmedString,
  title: requiredTrimmedString,
  sportType: requiredSportType,
  playType: requiredTrimmedString,
  tournamentType: requiredTrimmedString,
  tournamentName: requiredTrimmedString,
  recordedAt: z.string().datetime({ offset: true }),
});

export const updateScoutingProfileSchema = scoutingProfileEditorialFieldsSchema
  .extend({
    playerProfileId: z.string().trim().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one scouting profile field is required",
  });

export const upsertVideoVoteSchema = z.object({
  value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});

export const rankingsQuerySchema = z.object({
  sportType: optionalSportType,
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
});

export const topRankingsQuerySchema = z.object({
  sportType: optionalSportType,
  playType: z.string().trim().optional(),
  country: z.string().trim().optional(),
  city: z.string().trim().optional(),
  tournamentType: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type CreateScoutingProfileDto = z.infer<typeof createScoutingProfileSchema>;
export type UpdateScoutingProfileDto = z.infer<typeof updateScoutingProfileSchema>;
export type UpsertVideoVoteDto = z.infer<typeof upsertVideoVoteSchema>;
export type RankingsQueryDto = z.infer<typeof rankingsQuerySchema>;
export type TopRankingsQueryDto = z.infer<typeof topRankingsQuerySchema>;
