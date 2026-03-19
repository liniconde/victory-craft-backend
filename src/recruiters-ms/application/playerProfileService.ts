import mongoose from "mongoose";
import PlayerProfile from "../infrastructure/models/PlayerProfile";
import PlayerProfileVideoLink from "../infrastructure/models/PlayerProfileVideoLink";
import VideoScoutingProfile from "../infrastructure/models/VideoScoutingProfile";
import User from "../../models/User";
import Video from "../../models/Video";
import {
  CreatePlayerProfileDto,
  LinkPlayerProfileVideoDto,
  ListLinkedVideosQueryDto,
  ListPlayerProfilesQueryDto,
  UpdatePlayerProfileDto,
  createPlayerProfileSchema,
  linkPlayerProfileVideoSchema,
  listLinkedVideosQuerySchema,
  listPlayerProfilesQuerySchema,
  updatePlayerProfileSchema,
} from "../domain/playerProfileContracts";
import { getObjectS3SignedUrl } from "../../services/s3FilesService";
import { SPORT_TYPES } from "../../shared/sportTypes";

export class PlayerProfileServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type AuthUser = {
  id?: string;
  email?: string;
  role?: string;
};

const isObjectId = (value?: string | null) => Boolean(value && mongoose.Types.ObjectId.isValid(value));

const toObjectId = (value: string, fieldName: string) => {
  if (!isObjectId(value)) {
    throw new PlayerProfileServiceError(400, "invalid_object_id", `${fieldName} is invalid`);
  }
  return new mongoose.Types.ObjectId(value);
};

const parseZod = <T>(result: { success: boolean; data?: T; error?: any }, code: string) => {
  if (!result.success) {
    throw new PlayerProfileServiceError(400, code, result.error?.message || "Invalid payload");
  }
  return result.data as T;
};

const isPrivilegedRole = (role?: string) => {
  const normalized = (role || "").toLowerCase();
  return normalized === "admin" || normalized === "recruiter";
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizePlayerProfilePayload = (payload: CreatePlayerProfileDto | UpdatePlayerProfileDto) => {
  const data: Record<string, unknown> = { ...payload };
  if (typeof payload.birthDate === "string") {
    data.birthDate = new Date(payload.birthDate);
  }
  if (typeof payload.email === "string") {
    data.email = payload.email.trim().toLowerCase();
  }
  return data;
};

const ensureAuthenticatedUser = (authUser?: AuthUser) => {
  if (!authUser?.id) {
    throw new PlayerProfileServiceError(401, "unauthorized", "Authentication is required");
  }
  return authUser;
};

const mapPlayerProfileSummary = (profile: any) => ({
  _id: profile._id,
  userId: profile.userId || null,
  email: profile.email || null,
  fullName: profile.fullName,
  sportType: profile.sportType,
  primaryPosition: profile.primaryPosition,
  secondaryPosition: profile.secondaryPosition,
  team: profile.team,
  category: profile.category,
  country: profile.country,
  city: profile.city,
  avatarUrl: profile.avatarUrl,
  status: profile.status,
});

const mapPlayerProfile = (profile: any) => ({
  ...mapPlayerProfileSummary(profile),
  birthDate: profile.birthDate,
  dominantProfile: profile.dominantProfile,
  bio: profile.bio,
  createdBy: profile.createdBy || null,
  updatedBy: profile.updatedBy || null,
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
});

const mapVideoSummary = (video: any) => ({
  _id: video._id,
  s3Key: video.s3Key,
  uploadedAt: video.uploadedAt,
  videoUrl: video.s3Key ? getObjectS3SignedUrl(video.s3Key) : undefined,
  sportType: video.sportType,
  ownerUserId: video.ownerUserId || null,
});

const mapLink = (link: any) => ({
  _id: link._id,
  playerProfileId: link.playerProfileId,
  videoId: link.videoId,
  linkedBy: link.linkedBy || null,
  notes: link.notes,
  tags: link.tags || [],
  createdAt: link.createdAt,
  updatedAt: link.updatedAt,
});

const ensurePlayerProfileExists = async (profileId: string) => {
  const objectId = toObjectId(profileId, "profileId");
  const profile = await PlayerProfile.findById(objectId).lean();
  if (!profile) {
    throw new PlayerProfileServiceError(404, "player_profile_not_found", "Player profile not found");
  }
  return profile;
};

const ensureLibraryVideoExists = async (videoId: string) => {
  const objectId = toObjectId(videoId, "videoId");
  const video = await Video.findOne({ _id: objectId, videoType: "library" }).lean();
  if (!video) {
    throw new PlayerProfileServiceError(404, "video_not_found", "Library video not found");
  }
  return video;
};

const ensureProfileAccess = (profile: any, authUser: AuthUser) => {
  if (isPrivilegedRole(authUser.role)) return;
  if (!authUser.id || String(profile.userId || "") !== authUser.id) {
    throw new PlayerProfileServiceError(403, "forbidden", "Insufficient permissions for this player profile");
  }
};

const resolveTargetUser = async (payload: CreatePlayerProfileDto, authUser: AuthUser) => {
  if (!authUser.id) {
    throw new PlayerProfileServiceError(401, "unauthorized", "Authentication is required");
  }

  if (!isPrivilegedRole(authUser.role)) {
    return {
      userId: new mongoose.Types.ObjectId(authUser.id),
      email: authUser.email?.trim().toLowerCase() || undefined,
    };
  }

  let targetUserId = payload.userId;
  let targetEmail = payload.email?.trim().toLowerCase();

  if (targetUserId) {
    const user = await User.findById(toObjectId(targetUserId, "userId")).select({ _id: 1, email: 1 }).lean();
    if (!user) {
      throw new PlayerProfileServiceError(404, "user_not_found", "Target user not found");
    }
    targetUserId = String(user._id);
    targetEmail = targetEmail || user.email;
  } else if (targetEmail) {
    const user = await User.findOne({ email: targetEmail }).select({ _id: 1, email: 1 }).lean();
    if (user) {
      targetUserId = String(user._id);
      targetEmail = user.email;
    }
  }

  return {
    userId: targetUserId ? new mongoose.Types.ObjectId(targetUserId) : undefined,
    email: targetEmail,
  };
};

export const getMyPlayerProfile = async (authUser?: AuthUser) => {
  const user = ensureAuthenticatedUser(authUser);
  const profile = await PlayerProfile.findOne({ userId: toObjectId(user.id as string, "userId") }).lean();
  if (!profile) {
    throw new PlayerProfileServiceError(404, "player_profile_not_found", "Player profile not found");
  }
  return mapPlayerProfile(profile);
};

export const createPlayerProfile = async (payload: unknown, authUser?: AuthUser) => {
  const user = ensureAuthenticatedUser(authUser);
  const parsed = parseZod(createPlayerProfileSchema.safeParse(payload), "invalid_player_profile_payload");
  const target = await resolveTargetUser(parsed, user);
  const normalized = normalizePlayerProfilePayload(parsed);

  const actorId = isObjectId(user.id) ? new mongoose.Types.ObjectId(user.id) : undefined;

  try {
    const created = await PlayerProfile.create({
      ...normalized,
      userId: target.userId,
      email: target.email || normalized.email,
      createdBy: actorId,
      updatedBy: actorId,
    });
    return mapPlayerProfile(created.toObject());
  } catch (error: any) {
    if (error?.code === 11000) {
      throw new PlayerProfileServiceError(409, "player_profile_conflict", "Player profile already exists");
    }
    throw error;
  }
};

export const listPlayerProfiles = async (query: unknown, authUser?: AuthUser) => {
  const user = ensureAuthenticatedUser(authUser);
  const parsed = parseZod(listPlayerProfilesQuerySchema.safeParse(query), "invalid_player_profiles_query");

  const match: any = {};
  if (parsed.email) match.email = { $regex: escapeRegex(parsed.email), $options: "i" };
  if (parsed.team) match.team = { $regex: escapeRegex(parsed.team), $options: "i" };
  if (parsed.sportType) match.sportType = parsed.sportType;
  if (parsed.country) match.country = parsed.country;
  if (parsed.city) match.city = parsed.city;
  if (parsed.category) match.category = parsed.category;
  if (parsed.status) match.status = parsed.status;

  if (!isPrivilegedRole(user.role)) {
    match.userId = toObjectId(user.id as string, "userId");
  }

  const nameRegex =
    parsed.fullName || parsed.userName
      ? { $regex: escapeRegex((parsed.fullName || parsed.userName) as string), $options: "i" }
      : null;

  const page = parsed.page;
  const limit = parsed.limit;
  const skip = (page - 1) * limit;

  const rows = await PlayerProfile.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    ...(nameRegex
      ? [
          {
            $match: {
              $or: [{ fullName: nameRegex }, { "user.username": nameRegex }],
            },
          },
        ]
      : []),
    { $sort: { updatedAt: -1, _id: -1 } },
    {
      $facet: {
        items: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              userId: 1,
              email: 1,
              fullName: 1,
              sportType: 1,
              primaryPosition: 1,
              secondaryPosition: 1,
              team: 1,
              category: 1,
              country: 1,
              city: 1,
              avatarUrl: 1,
              status: 1,
              userName: "$user.username",
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const items = rows[0]?.items || [];
  const total = rows[0]?.totalCount?.[0]?.count || 0;

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

export const getPlayerProfileById = async (profileId: string, authUser?: AuthUser) => {
  const user = ensureAuthenticatedUser(authUser);
  const profile = await ensurePlayerProfileExists(profileId);
  ensureProfileAccess(profile, user);
  return mapPlayerProfile(profile);
};

export const updatePlayerProfile = async (profileId: string, payload: unknown, authUser?: AuthUser) => {
  const user = ensureAuthenticatedUser(authUser);
  const profile = await ensurePlayerProfileExists(profileId);
  ensureProfileAccess(profile, user);

  const parsed = parseZod(updatePlayerProfileSchema.safeParse(payload), "invalid_player_profile_payload");
  const normalized = normalizePlayerProfilePayload(parsed);

  if (!isPrivilegedRole(user.role)) {
    delete normalized.userId;
    delete normalized.email;
    delete normalized.status;
  }

  const updatedBy = isObjectId(user.id) ? new mongoose.Types.ObjectId(user.id) : undefined;
  if (updatedBy) {
    normalized.updatedBy = updatedBy;
  }

  try {
    const updated = await PlayerProfile.findByIdAndUpdate(profile._id, { $set: normalized }, { new: true }).lean();
    if (!updated) {
      throw new PlayerProfileServiceError(404, "player_profile_not_found", "Player profile not found");
    }
    return mapPlayerProfile(updated);
  } catch (error: any) {
    if (error?.code === 11000) {
      throw new PlayerProfileServiceError(409, "player_profile_conflict", "Player profile already exists");
    }
    throw error;
  }
};

export const linkVideoToPlayerProfile = async (profileId: string, payload: unknown, authUser?: AuthUser) => {
  const user = ensureAuthenticatedUser(authUser);
  const parsed = parseZod(linkPlayerProfileVideoSchema.safeParse(payload), "invalid_player_profile_video_payload");
  const profile = await ensurePlayerProfileExists(profileId);
  const video = await ensureLibraryVideoExists(parsed.videoId);

  ensureProfileAccess(profile, user);

  if (!isPrivilegedRole(user.role) && String(video.ownerUserId || "") !== user.id) {
    throw new PlayerProfileServiceError(403, "forbidden", "Users can only link their own library videos");
  }

  try {
    const linkedBy = isObjectId(user.id) ? new mongoose.Types.ObjectId(user.id) : undefined;
    const created = await PlayerProfileVideoLink.create({
      playerProfileId: profile._id,
      videoId: video._id,
      linkedBy,
      notes: parsed.notes,
      tags: parsed.tags || [],
    });

    await VideoScoutingProfile.findOneAndUpdate(
      { videoId: video._id },
      { $set: { playerProfileId: profile._id } },
      { new: false },
    );

    return {
      link: mapLink(created.toObject()),
      playerProfile: mapPlayerProfileSummary(profile),
      video: mapVideoSummary(video),
    };
  } catch (error: any) {
    if (error?.code === 11000) {
      throw new PlayerProfileServiceError(
        409,
        "player_profile_video_conflict",
        "Video is already linked to a player profile",
      );
    }
    throw error;
  }
};

export const listPlayerProfileVideos = async (profileId: string, query: unknown, authUser?: AuthUser) => {
  const user = ensureAuthenticatedUser(authUser);
  const parsed = parseZod(listLinkedVideosQuerySchema.safeParse(query), "invalid_player_profile_videos_query");
  const profile = await ensurePlayerProfileExists(profileId);
  ensureProfileAccess(profile, user);

  const page = parsed.page;
  const limit = parsed.limit;
  const skip = (page - 1) * limit;

  const rows = await PlayerProfileVideoLink.aggregate([
    { $match: { playerProfileId: profile._id } },
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $facet: {
        items: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "videos",
              localField: "videoId",
              foreignField: "_id",
              as: "video",
            },
          },
          { $unwind: "$video" },
          {
            $project: {
              _id: 1,
              playerProfileId: 1,
              videoId: 1,
              linkedBy: 1,
              notes: 1,
              tags: 1,
              createdAt: 1,
              updatedAt: 1,
              video: {
                _id: "$video._id",
                s3Key: "$video.s3Key",
                uploadedAt: "$video.uploadedAt",
                sportType: "$video.sportType",
                ownerUserId: "$video.ownerUserId",
              },
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const items = (rows[0]?.items || []).map((item: any) => ({
    link: mapLink(item),
    video: mapVideoSummary(item.video),
  }));
  const total = rows[0]?.totalCount?.[0]?.count || 0;

  return {
    playerProfile: mapPlayerProfileSummary(profile),
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

export const unlinkVideoFromPlayerProfile = async (profileId: string, videoId: string, authUser?: AuthUser) => {
  const user = ensureAuthenticatedUser(authUser);
  const profile = await ensurePlayerProfileExists(profileId);
  ensureProfileAccess(profile, user);
  const video = await ensureLibraryVideoExists(videoId);

  if (!isPrivilegedRole(user.role) && String(video.ownerUserId || "") !== user.id) {
    throw new PlayerProfileServiceError(403, "forbidden", "Users can only unlink their own library videos");
  }

  const deleted = await PlayerProfileVideoLink.findOneAndDelete({
    playerProfileId: profile._id,
    videoId: video._id,
  }).lean();

  if (!deleted) {
    throw new PlayerProfileServiceError(404, "player_profile_video_not_found", "Linked video not found");
  }

  await VideoScoutingProfile.findOneAndUpdate(
    { videoId: video._id, playerProfileId: profile._id },
    { $unset: { playerProfileId: 1 } },
    { new: false },
  );

  return {
    message: "Video unlinked successfully",
    playerProfile: mapPlayerProfileSummary(profile),
    video: mapVideoSummary(video),
  };
};

export const getPlayerProfilesCatalog = async (_authUser?: AuthUser) => {
  const rows = await PlayerProfile.aggregate([
    {
      $group: {
        _id: null,
        sportTypes: { $addToSet: "$sportType" },
        primaryPositions: { $addToSet: "$primaryPosition" },
        secondaryPositions: { $addToSet: "$secondaryPosition" },
        categories: { $addToSet: "$category" },
        countries: { $addToSet: "$country" },
        cities: { $addToSet: "$city" },
        teams: { $addToSet: "$team" },
        statuses: { $addToSet: "$status" },
      },
    },
  ]);

  const values = rows[0] || {};
  const sortTextArray = (items: Array<string | null | undefined>) =>
    [...new Set(items.filter((item): item is string => Boolean(item && item.trim())).map((item) => item.trim()))].sort(
      (a, b) => a.localeCompare(b),
    );

  return {
    sportTypes: [...SPORT_TYPES],
    positions: sortTextArray([...(values.primaryPositions || []), ...(values.secondaryPositions || [])]),
    categories: sortTextArray(values.categories || []),
    countries: sortTextArray(values.countries || []),
    cities: sortTextArray(values.cities || []),
    teams: sortTextArray(values.teams || []),
    statuses: sortTextArray(values.statuses || ["draft", "active", "archived"]),
  };
};
