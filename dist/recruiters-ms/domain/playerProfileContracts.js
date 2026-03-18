"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listLinkedVideosQuerySchema = exports.linkPlayerProfileVideoSchema = exports.listPlayerProfilesQuerySchema = exports.updatePlayerProfileSchema = exports.createPlayerProfileSchema = exports.playerProfileBaseSchema = void 0;
const zod_1 = require("zod");
const optionalTrimmedString = zod_1.z.string().trim().min(1).optional();
exports.playerProfileBaseSchema = zod_1.z.object({
    userId: zod_1.z.string().trim().optional(),
    email: zod_1.z.string().trim().email().optional(),
    fullName: zod_1.z.string().trim().min(1).max(200),
    sportType: optionalTrimmedString,
    primaryPosition: optionalTrimmedString,
    secondaryPosition: optionalTrimmedString,
    team: optionalTrimmedString,
    category: optionalTrimmedString,
    country: optionalTrimmedString,
    city: optionalTrimmedString,
    birthDate: zod_1.z.string().datetime({ offset: true }).optional(),
    dominantProfile: optionalTrimmedString,
    bio: zod_1.z.string().trim().max(5000).optional(),
    avatarUrl: zod_1.z.string().trim().url().optional(),
    status: zod_1.z.enum(["draft", "active", "archived"]).optional().default("active"),
});
exports.createPlayerProfileSchema = exports.playerProfileBaseSchema;
exports.updatePlayerProfileSchema = exports.playerProfileBaseSchema.partial().refine((data) => Object.keys(data).length > 0, { message: "At least one player profile field is required" });
exports.listPlayerProfilesQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional().default(20),
    email: zod_1.z.string().trim().optional(),
    userName: zod_1.z.string().trim().optional(),
    fullName: zod_1.z.string().trim().optional(),
    team: zod_1.z.string().trim().optional(),
    sportType: zod_1.z.string().trim().optional(),
    country: zod_1.z.string().trim().optional(),
    city: zod_1.z.string().trim().optional(),
    category: zod_1.z.string().trim().optional(),
    status: zod_1.z.string().trim().optional(),
});
exports.linkPlayerProfileVideoSchema = zod_1.z.object({
    videoId: zod_1.z.string().trim().min(1),
    notes: zod_1.z.string().trim().max(2000).optional(),
    tags: zod_1.z.array(zod_1.z.string().trim().min(1)).max(100).optional().default([]),
});
exports.listLinkedVideosQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional().default(20),
});
//# sourceMappingURL=playerProfileContracts.js.map