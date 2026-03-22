"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.topRankingsQuerySchema = exports.rankingsQuerySchema = exports.upsertVideoVoteSchema = exports.updateScoutingProfileSchema = exports.createScoutingProfileSchema = void 0;
const zod_1 = require("zod");
const sportTypes_1 = require("../../shared/sportTypes");
const requiredTrimmedString = zod_1.z.string().trim().min(1);
const optionalTrimmedString = requiredTrimmedString.optional();
const optionalSportType = zod_1.z.preprocess((value) => {
    const normalized = (0, sportTypes_1.normalizeSportType)(value);
    if (normalized)
        return normalized;
    return value;
}, zod_1.z.enum(sportTypes_1.SPORT_TYPES).optional());
const requiredSportType = zod_1.z.preprocess((value) => {
    const normalized = (0, sportTypes_1.normalizeSportType)(value);
    if (normalized)
        return normalized;
    return value;
}, zod_1.z.enum(sportTypes_1.SPORT_TYPES));
const scoutingProfileEditorialFieldsSchema = zod_1.z.object({
    publicationStatus: zod_1.z.enum(["draft", "published", "archived"]).optional(),
    title: optionalTrimmedString,
    sportType: optionalSportType,
    playType: optionalTrimmedString,
    tournamentType: optionalTrimmedString,
    playerAge: zod_1.z.number().int().min(0).max(100).optional(),
    jerseyNumber: zod_1.z.number().int().min(0).max(99).optional(),
    tournamentName: optionalTrimmedString,
    notes: zod_1.z.string().trim().max(5000).optional(),
    tags: zod_1.z.array(zod_1.z.string().trim().min(1)).max(100).optional(),
    recordedAt: zod_1.z.string().datetime({ offset: true }).optional(),
});
exports.createScoutingProfileSchema = scoutingProfileEditorialFieldsSchema.extend({
    playerProfileId: requiredTrimmedString,
    title: requiredTrimmedString,
    sportType: requiredSportType,
    playType: requiredTrimmedString,
    tournamentType: requiredTrimmedString,
    tournamentName: requiredTrimmedString,
    recordedAt: zod_1.z.string().datetime({ offset: true }),
});
exports.updateScoutingProfileSchema = scoutingProfileEditorialFieldsSchema
    .extend({
    playerProfileId: zod_1.z.string().trim().optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one scouting profile field is required",
});
exports.upsertVideoVoteSchema = zod_1.z.object({
    value: zod_1.z.union([zod_1.z.literal(-1), zod_1.z.literal(0), zod_1.z.literal(1)]),
});
exports.rankingsQuerySchema = zod_1.z.object({
    sportType: optionalSportType,
    playType: zod_1.z.string().trim().optional(),
    country: zod_1.z.string().trim().optional(),
    city: zod_1.z.string().trim().optional(),
    tournamentType: zod_1.z.string().trim().optional(),
    playerPosition: zod_1.z.string().trim().optional(),
    playerCategory: zod_1.z.string().trim().optional(),
    tournamentName: zod_1.z.string().trim().optional(),
    searchTerm: zod_1.z.string().trim().optional(),
    sortBy: zod_1.z.enum(["score", "recent", "upvotes"]).optional().default("score"),
    page: zod_1.z.coerce.number().int().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional().default(20),
});
exports.topRankingsQuerySchema = zod_1.z.object({
    sportType: optionalSportType,
    playType: zod_1.z.string().trim().optional(),
    country: zod_1.z.string().trim().optional(),
    city: zod_1.z.string().trim().optional(),
    tournamentType: zod_1.z.string().trim().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional().default(10),
});
//# sourceMappingURL=videoScoutingContracts.js.map