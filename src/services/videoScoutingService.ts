import mongoose from "mongoose";
import Video from "../models/Video";
import VideoScoutingProfile from "../models/VideoScoutingProfile";
import VideoVote from "../models/VideoVote";
import {
  CreateScoutingProfileDto,
  RankingsQueryDto,
  TopRankingsQueryDto,
  UpdateScoutingProfileDto,
  UpsertVideoVoteDto,
  createScoutingProfileSchema,
  rankingsQuerySchema,
  topRankingsQuerySchema,
  updateScoutingProfileSchema,
  upsertVideoVoteSchema,
} from "../contracts/videoScoutingContracts";
import { getObjectS3SignedUrl } from "./s3FilesService";

export class VideoScoutingServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const isObjectId = (value: string) => mongoose.Types.ObjectId.isValid(value);

const toObjectId = (value: string, fieldName: string) => {
  if (!isObjectId(value)) {
    throw new VideoScoutingServiceError(400, "invalid_object_id", `${fieldName} is invalid`);
  }
  return new mongoose.Types.ObjectId(value);
};

const parseZod = <T>(result: { success: boolean; data?: T; error?: any }, code: string) => {
  if (!result.success) {
    throw new VideoScoutingServiceError(400, code, result.error?.message || "Invalid payload");
  }
  return result.data as T;
};

const normalizeScoutingPayload = (payload: CreateScoutingProfileDto | UpdateScoutingProfileDto) => {
  const data: Record<string, unknown> = { ...payload };
  if (typeof payload.recordedAt === "string") {
    data.recordedAt = new Date(payload.recordedAt);
  }
  if (Array.isArray(payload.tags)) {
    data.tags = payload.tags.map((tag) => tag.trim()).filter(Boolean);
  }
  return data;
};

const ensureLibraryVideoExists = async (videoId: string) => {
  const objectId = toObjectId(videoId, "videoId");
  const video = await Video.findOne({ _id: objectId, videoType: "library" }).lean();
  if (!video) {
    throw new VideoScoutingServiceError(404, "video_not_found", "Library video not found");
  }
  return video;
};

const roleCanEditScouting = (role?: string) => {
  const normalized = (role || "").toLowerCase();
  return normalized === "admin" || normalized === "recruiter" || normalized === "user";
};

const roleCanManageScouting = (role?: string) => {
  const normalized = (role || "").toLowerCase();
  return normalized === "admin" || normalized === "recruiter";
};

const getVoteSummary = async (videoId: mongoose.Types.ObjectId) => {
  const rows = await VideoVote.aggregate([
    { $match: { videoId } },
    {
      $group: {
        _id: null,
        upvotes: { $sum: { $cond: [{ $eq: ["$value", 1] }, 1, 0] } },
        downvotes: { $sum: { $cond: [{ $eq: ["$value", -1] }, 1, 0] } },
      },
    },
  ]);

  const upvotes = rows[0]?.upvotes || 0;
  const downvotes = rows[0]?.downvotes || 0;
  const netVotes = upvotes - downvotes;

  return {
    upvotes,
    downvotes,
    netVotes,
  };
};

const getMyVote = async (videoId: mongoose.Types.ObjectId, userId?: string) => {
  if (!userId || !isObjectId(userId)) return null;
  const vote = await VideoVote.findOne({ videoId, userId: new mongoose.Types.ObjectId(userId) })
    .select({ value: 1 })
    .lean();
  return vote?.value || null;
};

const completenessFields = [
  "title",
  "sportType",
  "playType",
  "tournamentType",
  "playerName",
  "playerAge",
  "playerPosition",
  "playerTeam",
  "playerCategory",
  "jerseyNumber",
  "dominantProfile",
  "country",
  "city",
  "tournamentName",
  "tags",
  "recordedAt",
];

const computeRankingScore = (input: {
  upvotes: number;
  downvotes: number;
  netVotes: number;
  scoutingProfile?: any | null;
  video?: any | null;
}) => {
  const baseScore = input.netVotes * 10 + input.upvotes * 2 - input.downvotes;

  const profile = input.scoutingProfile || null;
  let completenessRatio = 0;
  if (profile) {
    const completed = completenessFields.reduce((acc, field) => {
      const value = (profile as any)[field];
      const hasValue =
        Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && String(value).trim() !== "";
      return acc + (hasValue ? 1 : 0);
    }, 0);
    completenessRatio = completed / completenessFields.length;
  }
  const completenessBonus = Math.round(completenessRatio * 12);

  const referenceDate = profile?.recordedAt || input.video?.uploadedAt;
  let freshnessBonus = 0;
  if (referenceDate) {
    const days = Math.max(
      0,
      Math.floor((Date.now() - new Date(referenceDate).getTime()) / (1000 * 60 * 60 * 24)),
    );
    freshnessBonus = Math.max(0, 6 - Math.floor(days / 30));
  }

  return baseScore + completenessBonus + freshnessBonus;
};

const toVideoSummary = (video: any) => ({
  _id: video._id,
  s3Key: video.s3Key,
  sportType: video.sportType,
  uploadedAt: video.uploadedAt,
  videoUrl: video.s3Key ? getObjectS3SignedUrl(video.s3Key) : undefined,
});

const mapScoutingProfile = (profile: any) => {
  if (!profile) return null;
  return {
    _id: profile._id,
    videoId: profile.videoId,
    title: profile.title,
    sportType: profile.sportType,
    playType: profile.playType,
    tournamentType: profile.tournamentType,
    playerName: profile.playerName,
    playerAge: profile.playerAge,
    playerPosition: profile.playerPosition,
    playerTeam: profile.playerTeam,
    playerCategory: profile.playerCategory,
    jerseyNumber: profile.jerseyNumber,
    dominantProfile: profile.dominantProfile,
    country: profile.country,
    city: profile.city,
    tournamentName: profile.tournamentName,
    notes: profile.notes,
    tags: profile.tags || [],
    recordedAt: profile.recordedAt,
    createdBy: profile.createdBy,
    updatedBy: profile.updatedBy,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createVideoScoutingProfile = async (
  videoId: string,
  payload: unknown,
  authUser?: { id?: string; role?: string },
) => {
  if (!roleCanEditScouting(authUser?.role)) {
    throw new VideoScoutingServiceError(403, "forbidden", "Insufficient permissions to create scouting profile");
  }

  const parsed = parseZod(createScoutingProfileSchema.safeParse(payload), "invalid_scouting_profile_payload");
  const video = await ensureLibraryVideoExists(videoId);
  const videoObjectId = new mongoose.Types.ObjectId(String(video._id));

  const existing = await VideoScoutingProfile.findOne({ videoId: videoObjectId }).lean();
  if (existing) {
    throw new VideoScoutingServiceError(
      409,
      "scouting_profile_already_exists",
      "Scouting profile already exists for this video",
    );
  }

  const createdBy = authUser?.id && isObjectId(authUser.id) ? new mongoose.Types.ObjectId(authUser.id) : undefined;

  const created = await VideoScoutingProfile.create({
    videoId: videoObjectId,
    ...normalizeScoutingPayload(parsed),
    createdBy,
    updatedBy: createdBy,
  });

  return {
    video: toVideoSummary(video),
    scoutingProfile: mapScoutingProfile(created.toObject()),
  };
};

export const getVideoScoutingProfile = async (videoId: string) => {
  const video = await ensureLibraryVideoExists(videoId);
  const profile = await VideoScoutingProfile.findOne({ videoId: video._id }).lean();

  if (!profile) {
    throw new VideoScoutingServiceError(404, "scouting_profile_not_found", "Scouting profile not found");
  }

  return {
    video: toVideoSummary(video),
    scoutingProfile: mapScoutingProfile(profile),
  };
};

export const updateVideoScoutingProfile = async (
  videoId: string,
  payload: unknown,
  authUser?: { id?: string; role?: string },
) => {
  if (!roleCanEditScouting(authUser?.role)) {
    throw new VideoScoutingServiceError(403, "forbidden", "Insufficient permissions to update scouting profile");
  }

  const parsed = parseZod(updateScoutingProfileSchema.safeParse(payload), "invalid_scouting_profile_payload");
  await ensureLibraryVideoExists(videoId);
  const videoObjectId = toObjectId(videoId, "videoId");

  const updateData = normalizeScoutingPayload(parsed);
  const updatedBy = authUser?.id && isObjectId(authUser.id) ? new mongoose.Types.ObjectId(authUser.id) : undefined;
  if (updatedBy) {
    updateData.updatedBy = updatedBy;
  }

  const updated = await VideoScoutingProfile.findOneAndUpdate(
    { videoId: videoObjectId },
    { $set: updateData },
    { new: true },
  ).lean();

  if (!updated) {
    throw new VideoScoutingServiceError(404, "scouting_profile_not_found", "Scouting profile not found");
  }

  return {
    scoutingProfile: mapScoutingProfile(updated),
  };
};

export const upsertVideoVote = async (
  videoId: string,
  payload: unknown,
  authUser?: { id?: string; role?: string },
) => {
  if (!authUser?.id) {
    throw new VideoScoutingServiceError(401, "unauthorized", "Authentication is required");
  }

  const parsed = parseZod(upsertVideoVoteSchema.safeParse(payload), "invalid_vote_payload");
  await ensureLibraryVideoExists(videoId);

  const videoObjectId = toObjectId(videoId, "videoId");
  const userObjectId = toObjectId(authUser.id, "userId");

  let currentVote: number | null = null;
  if (parsed.value === 0) {
    await VideoVote.findOneAndDelete({ videoId: videoObjectId, userId: userObjectId });
  } else {
    const vote = await VideoVote.findOneAndUpdate(
      { videoId: videoObjectId, userId: userObjectId },
      { $set: { value: parsed.value } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
    currentVote = vote?.value || null;
  }

  const summary = await getVideoVoteSummary(videoId, authUser.id);

  return {
    vote: {
      videoId,
      userId: authUser.id,
      value: currentVote,
    },
    summary,
  };
};

export const deleteVideoVoteByUser = async (
  videoId: string,
  userId: string,
  authUser?: { id?: string; role?: string },
) => {
  if (!authUser?.id) {
    throw new VideoScoutingServiceError(401, "unauthorized", "Authentication is required");
  }

  const sameUser = authUser.id === userId;
  const isPrivileged = roleCanManageScouting(authUser.role);
  if (!sameUser && !isPrivileged) {
    throw new VideoScoutingServiceError(403, "forbidden", "Insufficient permissions to delete this vote");
  }

  await ensureLibraryVideoExists(videoId);
  const videoObjectId = toObjectId(videoId, "videoId");
  const userObjectId = toObjectId(userId, "userId");

  await VideoVote.findOneAndDelete({ videoId: videoObjectId, userId: userObjectId });
  const summary = await getVideoVoteSummary(videoId, authUser.id);

  return {
    message: "Vote deleted successfully",
    summary,
  };
};

export const getVideoVoteSummary = async (videoId: string, currentUserId?: string) => {
  await ensureLibraryVideoExists(videoId);
  const videoObjectId = toObjectId(videoId, "videoId");
  const votes = await getVoteSummary(videoObjectId);

  const profile = await VideoScoutingProfile.findOne({ videoId: videoObjectId }).lean();
  const video = await Video.findById(videoObjectId).lean();
  const score = computeRankingScore({ ...votes, scoutingProfile: profile, video });

  return {
    videoId,
    upvotes: votes.upvotes,
    downvotes: votes.downvotes,
    netVotes: votes.netVotes,
    score,
    myVote: await getMyVote(videoObjectId, currentUserId),
  };
};

const buildRankingFilterStages = (query: RankingsQueryDto | TopRankingsQueryDto) => {
  const profileFilters: Record<string, unknown> = {};

  if (query.sportType) profileFilters["scoutingProfile.sportType"] = query.sportType;
  if (query.playType) profileFilters["scoutingProfile.playType"] = query.playType;
  if (query.country) profileFilters["scoutingProfile.country"] = query.country;
  if (query.city) profileFilters["scoutingProfile.city"] = query.city;
  if (query.tournamentType) profileFilters["scoutingProfile.tournamentType"] = query.tournamentType;
  if ((query as RankingsQueryDto).playerPosition)
    profileFilters["scoutingProfile.playerPosition"] = (query as RankingsQueryDto).playerPosition;
  if ((query as RankingsQueryDto).playerCategory)
    profileFilters["scoutingProfile.playerCategory"] = (query as RankingsQueryDto).playerCategory;
  if ((query as RankingsQueryDto).tournamentName)
    profileFilters["scoutingProfile.tournamentName"] = (query as RankingsQueryDto).tournamentName;

  const searchTerm = (query as RankingsQueryDto).searchTerm;
  const searchFilters =
    typeof searchTerm === "string" && searchTerm.trim()
      ? {
          $or: [
            { s3Key: { $regex: escapeRegex(searchTerm.trim()), $options: "i" } },
            { "scoutingProfile.title": { $regex: escapeRegex(searchTerm.trim()), $options: "i" } },
            { "scoutingProfile.playerName": { $regex: escapeRegex(searchTerm.trim()), $options: "i" } },
            { "scoutingProfile.playerTeam": { $regex: escapeRegex(searchTerm.trim()), $options: "i" } },
            {
              "scoutingProfile.tournamentName": {
                $regex: escapeRegex(searchTerm.trim()),
                $options: "i",
              },
            },
          ],
        }
      : null;

  const matchStages: any[] = [];
  if (Object.keys(profileFilters).length > 0) {
    matchStages.push({ $match: profileFilters });
  }
  if (searchFilters) {
    matchStages.push({ $match: searchFilters });
  }

  if (!query.includeWithoutProfile) {
    matchStages.push({ $match: { scoutingProfile: { $ne: null } } });
  }

  return matchStages;
};

const aggregateRankingsCandidates = async (query: RankingsQueryDto | TopRankingsQueryDto) => {
  const pipeline: any[] = [
    { $match: { videoType: "library" } },
    {
      $lookup: {
        from: "video_scouting_profiles",
        localField: "_id",
        foreignField: "videoId",
        as: "scoutingProfile",
      },
    },
    { $unwind: { path: "$scoutingProfile", preserveNullAndEmptyArrays: true } },
    ...buildRankingFilterStages(query),
    {
      $lookup: {
        from: "video_votes",
        let: { videoId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$videoId", "$$videoId"] } } },
          {
            $group: {
              _id: null,
              upvotes: { $sum: { $cond: [{ $eq: ["$value", 1] }, 1, 0] } },
              downvotes: { $sum: { $cond: [{ $eq: ["$value", -1] }, 1, 0] } },
            },
          },
        ],
        as: "voteAgg",
      },
    },
    {
      $addFields: {
        voteAgg: {
          $ifNull: [
            { $arrayElemAt: ["$voteAgg", 0] },
            { upvotes: 0, downvotes: 0 },
          ],
        },
      },
    },
    {
      $project: {
        _id: 1,
        s3Key: 1,
        sportType: 1,
        uploadedAt: 1,
        scoutingProfile: 1,
        upvotes: "$voteAgg.upvotes",
        downvotes: "$voteAgg.downvotes",
      },
    },
  ];

  return Video.aggregate(pipeline);
};

const mapRankingItem = (row: any) => {
  const upvotes = row.upvotes || 0;
  const downvotes = row.downvotes || 0;
  const netVotes = upvotes - downvotes;
  const score = computeRankingScore({
    upvotes,
    downvotes,
    netVotes,
    scoutingProfile: row.scoutingProfile,
    video: row,
  });

  return {
    video: {
      _id: row._id,
      s3Key: row.s3Key,
      sportType: row.sportType,
      uploadedAt: row.uploadedAt,
      videoUrl: row.s3Key ? getObjectS3SignedUrl(row.s3Key) : undefined,
    },
    scoutingProfile: mapScoutingProfile(row.scoutingProfile),
    ranking: {
      score,
      upvotes,
      downvotes,
      netVotes,
    },
  };
};

const getVideoUploadedAtTimestamp = (item: any) => new Date(item?.video?.uploadedAt || 0).getTime();

const compareRankingItemsByRecent = (a: any, b: any) => {
  const uploadedAtDiff = getVideoUploadedAtTimestamp(b) - getVideoUploadedAtTimestamp(a);
  if (uploadedAtDiff !== 0) return uploadedAtDiff;
  return String(b?.video?._id || "").localeCompare(String(a?.video?._id || ""));
};

const compareRankingItems = (sortBy: RankingsQueryDto["sortBy"], a: any, b: any) => {
  if (sortBy === "recent") {
    return compareRankingItemsByRecent(a, b);
  }

  if (sortBy === "upvotes") {
    const upvotesDiff = b.ranking.upvotes - a.ranking.upvotes;
    if (upvotesDiff !== 0) return upvotesDiff;
    return compareRankingItemsByRecent(a, b);
  }

  const scoreDiff = b.ranking.score - a.ranking.score;
  if (scoreDiff !== 0) return scoreDiff;
  return compareRankingItemsByRecent(a, b);
};

export const getVideoLibraryRankings = async (query: unknown, currentUserId?: string) => {
  const parsed = parseZod(rankingsQuerySchema.safeParse(query), "invalid_rankings_query");

  const rows = await aggregateRankingsCandidates(parsed);
  const mapped = rows.map(mapRankingItem);
  mapped.sort((a, b) => compareRankingItems(parsed.sortBy, a, b));

  const page = parsed.page;
  const limit = parsed.limit;
  const total = mapped.length;
  const start = (page - 1) * limit;
  const items = mapped.slice(start, start + limit);

  const myVotesByVideoId = new Map<string, number>();
  if (currentUserId && isObjectId(currentUserId) && items.length > 0) {
    const rowsVotes = await VideoVote.find({
      videoId: { $in: items.map((item) => new mongoose.Types.ObjectId(item.video._id)) },
      userId: new mongoose.Types.ObjectId(currentUserId),
    })
      .select({ videoId: 1, value: 1 })
      .lean();

    rowsVotes.forEach((vote) => {
      myVotesByVideoId.set(String(vote.videoId), vote.value);
    });
  }

  return {
    items: items.map((item) => ({
      ...item,
      myVote: myVotesByVideoId.get(String(item.video._id)) || null,
    })),
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

export const getTopVideoLibraryRankings = async (query: unknown, currentUserId?: string) => {
  const parsed = parseZod(topRankingsQuerySchema.safeParse(query), "invalid_top_rankings_query");

  const rows = await aggregateRankingsCandidates(parsed);
  const top = rows
    .map(mapRankingItem)
    .sort((a, b) => b.ranking.score - a.ranking.score)
    .slice(0, parsed.limit);

  const myVotesByVideoId = new Map<string, number>();
  if (currentUserId && isObjectId(currentUserId) && top.length > 0) {
    const rowsVotes = await VideoVote.find({
      videoId: { $in: top.map((item) => new mongoose.Types.ObjectId(item.video._id)) },
      userId: new mongoose.Types.ObjectId(currentUserId),
    })
      .select({ videoId: 1, value: 1 })
      .lean();

    rowsVotes.forEach((vote) => {
      myVotesByVideoId.set(String(vote.videoId), vote.value);
    });
  }

  return top.map((item) => ({
    ...item,
    myVote: myVotesByVideoId.get(String(item.video._id)) || null,
  }));
};

const sortTextArray = (value: Array<string | null | undefined>) =>
  [...new Set(value.filter((item): item is string => Boolean(item && item.trim())).map((item) => item.trim()))].sort(
    (a, b) => a.localeCompare(b),
  );

export const getVideoLibraryFiltersCatalog = async () => {
  const profileRows = await VideoScoutingProfile.aggregate([
    {
      $group: {
        _id: null,
        sportTypes: { $addToSet: "$sportType" },
        playTypes: { $addToSet: "$playType" },
        tournamentTypes: { $addToSet: "$tournamentType" },
        countries: { $addToSet: "$country" },
        cities: { $addToSet: "$city" },
        playerPositions: { $addToSet: "$playerPosition" },
        playerCategories: { $addToSet: "$playerCategory" },
        tournaments: { $addToSet: "$tournamentName" },
      },
    },
  ]);

  const tagsRows = await VideoScoutingProfile.aggregate([
    { $unwind: { path: "$tags", preserveNullAndEmptyArrays: false } },
    { $group: { _id: null, tags: { $addToSet: "$tags" } } },
  ]);

  const values = profileRows[0] || {};

  return {
    sportTypes: sortTextArray(values.sportTypes || []),
    playTypes: sortTextArray(values.playTypes || []),
    tournamentTypes: sortTextArray(values.tournamentTypes || []),
    countries: sortTextArray(values.countries || []),
    cities: sortTextArray(values.cities || []),
    playerPositions: sortTextArray(values.playerPositions || []),
    playerCategories: sortTextArray(values.playerCategories || []),
    tournaments: sortTextArray(values.tournaments || []),
    tags: sortTextArray(tagsRows[0]?.tags || []),
  };
};

export const getVideoRecruiterView = async (videoId: string, currentUserId?: string) => {
  const video = await ensureLibraryVideoExists(videoId);
  const videoObjectId = new mongoose.Types.ObjectId(String(video._id));
  const profile = await VideoScoutingProfile.findOne({ videoId: videoObjectId }).lean();
  const ranking = await getVideoVoteSummary(videoId, currentUserId);

  let relatedVideos: any[] = [];
  if (profile) {
    const relatedProfiles = await VideoScoutingProfile.find({
      _id: { $ne: profile._id },
      $or: [
        { sportType: profile.sportType },
        { playerCategory: profile.playerCategory },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean();

    const relatedVideoIds = relatedProfiles.map((item) => item.videoId);
    const relatedBaseVideos = await Video.find({ _id: { $in: relatedVideoIds }, videoType: "library" })
      .select({ _id: 1, s3Key: 1, uploadedAt: 1, sportType: 1 })
      .lean();

    const baseVideoById = new Map(relatedBaseVideos.map((item) => [String(item._id), item]));

    relatedVideos = await Promise.all(
      relatedProfiles
        .map((relatedProfile) => {
          const relatedVideo = baseVideoById.get(String(relatedProfile.videoId));
          if (!relatedVideo) return null;
          return {
            video: toVideoSummary(relatedVideo),
            scoutingProfile: mapScoutingProfile(relatedProfile),
          };
        })
        .filter(Boolean),
    );
  }

  return {
    video: toVideoSummary(video),
    scoutingProfile: mapScoutingProfile(profile),
    ranking,
    relatedVideos,
  };
};
