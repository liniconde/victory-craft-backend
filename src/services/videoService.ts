import Video from "../models/Video";
import { getUploadS3SignedUrl } from "./s3FilesService";

/**
 * Crea un nuevo video asociado a una campo y opcionalmente a un partido.
 * @param videoData - Datos del video (fieldId, matchId, s3Key).
 * @returns Video con URL firmada.
 */
export const createVideo = async (videoData: any) => {
  try {
    const video = await Video.create(videoData);
    return updateVideoSignedUrl(video);
  } catch (error: any) {
    throw new Error(`Error creating video: ${error.message}`);
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
