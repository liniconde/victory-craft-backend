"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.topRankingsQuerySchema = exports.rankingsQuerySchema = exports.upsertVideoVoteSchema = exports.updateScoutingProfileSchema = exports.createScoutingProfileSchema = exports.scoutingProfileBaseSchema = void 0;
const zod_1 = require("zod");
const optionalTrimmedString = zod_1.z.string().trim().min(1).optional();
const coerceBooleanFromQuery = zod_1.z.preprocess((value) => {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true")
            return true;
        if (normalized === "false")
            return false;
    }
    return value;
}, zod_1.z.boolean());
exports.scoutingProfileBaseSchema = zod_1.z.object({
    title: optionalTrimmedString,
    sportType: optionalTrimmedString,
    playType: optionalTrimmedString,
    tournamentType: optionalTrimmedString,
    playerName: optionalTrimmedString,
    playerAge: zod_1.z.number().int().min(0).max(100).optional(),
    playerPosition: optionalTrimmedString,
    playerTeam: optionalTrimmedString,
    playerCategory: optionalTrimmedString,
    jerseyNumber: zod_1.z.number().int().min(0).max(99).optional(),
    dominantProfile: optionalTrimmedString,
    country: optionalTrimmedString,
    city: optionalTrimmedString,
    tournamentName: optionalTrimmedString,
    notes: zod_1.z.string().trim().max(5000).optional(),
    tags: zod_1.z.array(zod_1.z.string().trim().min(1)).max(100).optional(),
    recordedAt: zod_1.z.string().datetime({ offset: true }).optional(),
});
exports.createScoutingProfileSchema = exports.scoutingProfileBaseSchema.refine((data) => Object.keys(data).length > 0, { message: "At least one scouting profile field is required" });
exports.updateScoutingProfileSchema = exports.scoutingProfileBaseSchema;
exports.upsertVideoVoteSchema = zod_1.z.object({
    value: zod_1.z.union([zod_1.z.literal(-1), zod_1.z.literal(0), zod_1.z.literal(1)]),
});
exports.rankingsQuerySchema = zod_1.z.object({
    sportType: zod_1.z.string().trim().optional(),
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
    includeWithoutProfile: coerceBooleanFromQuery.optional().default(false),
});
exports.topRankingsQuerySchema = zod_1.z.object({
    sportType: zod_1.z.string().trim().optional(),
    playType: zod_1.z.string().trim().optional(),
    country: zod_1.z.string().trim().optional(),
    city: zod_1.z.string().trim().optional(),
    tournamentType: zod_1.z.string().trim().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional().default(10),
    includeWithoutProfile: coerceBooleanFromQuery.optional().default(false),
});
//# sourceMappingURL=videoScoutingContracts.js.map