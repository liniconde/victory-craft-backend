import Video from "../models/Video";
import { getUploadS3SignedUrl } from "./s3FilesService";
import { getObjectS3SignedUrl } from "./s3FilesService";

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
export const getLibraryVideosPaginated = async (page = 1, limit = 20) => {
  try {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    // For now, library listing should include legacy videos regardless of `videoType`.
    const filter = {
      s3Key: { $exists: true, $ne: "" },
    };

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .select("_id s3Key uploadedAt")
        .lean(),
      Video.countDocuments(filter),
    ]);

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
