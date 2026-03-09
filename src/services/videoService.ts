import Video from "../models/Video";
import { getUploadS3SignedUrl } from "./s3FilesService";
import { getObjectS3SignedUrl } from "./s3FilesService";
import { deleteObjectS3 } from "./s3FilesService";
import mongoose from "mongoose";
import VideoStats from "../models/VideoStats";
import AnalysisJob from "../models/AnalysisJob";
import VideoAnalysisRecord from "../models/VideoAnalysisRecord";
import AnalysisArtifact from "../models/AnalysisArtifact";
import VideoSegment from "../models/VideoSegment";
import Notification from "../models/Notification";

export class VideoServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Agrega la URL firmada de S3 a un video antes de retornarlo.
 * @param video - Documento del video en la base de datos.
 * @returns Video con URL firmada.
 */
const updateVideoSignedUrl = async (video: any) => {
  if (!video.s3Key) return video;
  const videoUrl = getUploadS3SignedUrl(video.s3Key);
  return { ...video.toObject(), videoUrl };
};

/**
 * Crea un nuevo video asociado a una campo y opcionalmente a un partido.
 * @param videoData - Datos del video (fieldId, matchId, s3Key).
 * @returns Video con URL firmada.
 */
export const createVideo = async (videoData: any) => {
  try {
    const video = await Video.create({ ...videoData, videoType: "field" });
    return updateVideoSignedUrl(video);
  } catch (error: any) {
    throw new Error(`Error creating video: ${error.message}`);
  }
};

/**
 * Crea un nuevo video de biblioteca (sin asociacion a cancha/slot).
 * @param videoData - Datos del video (s3Key, sportType opcional).
 * @returns Video creado.
 */
export const createLibraryVideo = async (videoData: any) => {
  try {
    const video = await Video.create({
      s3Key: videoData.s3Key,
      sportType: videoData.sportType,
      s3Url: videoData.s3Url,
      videoType: "library",
    });
    return updateVideoSignedUrl(video);
  } catch (error: any) {
    throw new Error(`Error creating video: ${error.message}`);
  }
};

/**
 * Lista videos de biblioteca con paginacion para mostrar en listado.
 * @param page - Pagina actual (base 1).
 * @param limit - Cantidad por pagina.
 */
export const getLibraryVideosPaginated = async (
  page = 1,
  limit = 20,
  searchTerm?: string,
  sportType?: string,
) => {
  try {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const baseMatch: any = { s3Key: { $exists: true, $ne: "" } };
    const safeQuery = (searchTerm || "").trim();
    const safeSportType = (sportType || "").trim().toLowerCase();

    if (safeSportType) {
      baseMatch.sportType = safeSportType;
    }

    const matchStage = !safeQuery
      ? baseMatch
      : {
          $and: [
            baseMatch,
            {
              $or: [
                { s3Key: { $regex: escapeRegex(safeQuery), $options: "i" } },
                {
                  $expr: {
                    $regexMatch: {
                      input: { $toString: "$_id" },
                      regex: escapeRegex(safeQuery),
                      options: "i",
                    },
                  },
                },
              ],
            },
          ],
        };

    const rows = await Video.aggregate([
      { $match: matchStage },
      { $sort: { uploadedAt: -1 } },
      {
        $facet: {
          items: [{ $skip: skip }, { $limit: safeLimit }, { $project: { _id: 1, s3Key: 1, uploadedAt: 1 } }],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const videos = rows[0]?.items || [];
    const total = rows[0]?.totalCount?.[0]?.count || 0;

    const items = videos.map((video: any) => ({
      _id: video._id,
      s3Key: video.s3Key,
      uploadedAt: video.uploadedAt,
      videoUrl: getObjectS3SignedUrl(video.s3Key),
    }));

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
        hasNextPage: safePage * safeLimit < total,
        hasPrevPage: safePage > 1,
      },
    };
  } catch (error: any) {
    throw new Error(`Error fetching library videos: ${error.message}`);
  }
};

export const updateVideo = async (id: string, updateData: any) => {
  try {
    const video = await Video.findByIdAndUpdate(id, updateData, { new: true });
    if (!video) throw new Error("Video not found");
    return updateVideoSignedUrl(video);
  } catch (error) {
    throw new Error(`Error updating video: ${error.message}`);
  }
};

export const getVideosByField = async (fieldId: string) => {
  try {
    const videos = await Video.find({ fieldId });
    // Map videos to include signed URL
    return Promise.all(videos.map((video) => updateVideoSignedUrl(video)));
  } catch (error: any) {
    throw new Error(`Error fetching videos by field: ${error.message}`);
  }
};

export const deleteVideoById = async (videoId: string) => {
  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new VideoServiceError(400, "invalid_video_id", "Video id is invalid");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new VideoServiceError(404, "video_not_found", "Video not found");
  }

  if (video.s3Key) {
    try {
      await deleteObjectS3(video.s3Key);
    } catch (error: any) {
      // If the file is already gone from S3, we continue with DB cleanup.
      const errorCode = error?.code || error?.name;
      if (errorCode !== "NoSuchKey" && errorCode !== "NotFound") {
        throw new VideoServiceError(
          502,
          "s3_delete_failed",
          `Failed to delete object from S3: ${error?.message || "unknown error"}`,
        );
      }
    }
  }

  const videoObjectId = new mongoose.Types.ObjectId(videoId);

  await Promise.all([
    Video.findByIdAndDelete(videoObjectId),
    VideoStats.deleteOne({ videoId: videoObjectId }),
    AnalysisJob.deleteMany({ videoId: videoObjectId }),
    VideoAnalysisRecord.deleteMany({ videoId: videoObjectId }),
    AnalysisArtifact.deleteMany({ videoId: videoObjectId }),
    Notification.deleteMany({ videoId: videoObjectId }),
    VideoSegment.deleteMany({ libraryVideoId: videoObjectId }),
  ]);

  return {
    message: "Video deleted successfully",
    deletedVideoId: videoId,
    deletedS3Key: video.s3Key,
  };
};
