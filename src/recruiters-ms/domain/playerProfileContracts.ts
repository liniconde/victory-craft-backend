import { z } from "zod";
import { normalizeSportType, SPORT_TYPES } from "../../shared/sportTypes";

const optionalTrimmedString = z.string().trim().min(1).optional();
const optionalSportType = z.preprocess(
  (value) => {
    const normalized = normalizeSportType(value);
    if (normalized) return normalized;
    return value;
  },
  z.enum(SPORT_TYPES).optional(),
);

export const playerProfileBaseSchema = z.object({
  userId: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  fullName: z.string().trim().min(1).max(200),
  sportType: optionalSportType,
  primaryPosition: optionalTrimmedString,
  secondaryPosition: optionalTrimmedString,
  team: optionalTrimmedString,
  category: optionalTrimmedString,
  country: optionalTrimmedString,
  city: optionalTrimmedString,
  birthDate: z.string().datetime({ offset: true }).optional(),
  dominantProfile: optionalTrimmedString,
  bio: z.string().trim().max(5000).optional(),
  avatarUrl: z.string().trim().url().optional(),
  status: z.enum(["draft", "active", "archived"]).optional().default("active"),
});

export const createPlayerProfileSchema = playerProfileBaseSchema;

export const updatePlayerProfileSchema = playerProfileBaseSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one player profile field is required" },
);

export const listPlayerProfilesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  email: z.string().trim().optional(),
  userName: z.string().trim().optional(),
  fullName: z.string().trim().optional(),
  team: z.string().trim().optional(),
  sportType: optionalSportType,
  country: z.string().trim().optional(),
  city: z.string().trim().optional(),
  category: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

export const linkPlayerProfileVideoSchema = z.object({
  videoId: z.string().trim().min(1),
  notes: z.string().trim().max(2000).optional(),
  tags: z.array(z.string().trim().min(1)).max(100).optional().default([]),
});

export const listLinkedVideosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreatePlayerProfileDto = z.infer<typeof createPlayerProfileSchema>;
export type UpdatePlayerProfileDto = z.infer<typeof updatePlayerProfileSchema>;
export type ListPlayerProfilesQueryDto = z.infer<typeof listPlayerProfilesQuerySchema>;
export type LinkPlayerProfileVideoDto = z.infer<typeof linkPlayerProfileVideoSchema>;
export type ListLinkedVideosQueryDto = z.infer<typeof listLinkedVideosQuerySchema>;
