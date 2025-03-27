import VideoStats from "../models/VideoStats";

/**
 * Crea estadísticas para un video.
 * @param statsData - Objeto con videoId, sportType, teams, generatedByModel
 * @returns Estadísticas creadas
 */
export const createVideoStats = async (statsData: any) => {
  try {
    const stats = await VideoStats.create(statsData);
    return stats.toObject();
  } catch (error: any) {
    throw new Error(`Error creating video stats: ${error.message}`);
  }
};

/**
 * Obtiene las estadísticas de un video por ID de video.
 * @param videoId - ID del video
 * @returns Estadísticas del video
 */
export const getVideoStatsByVideoId = async (videoId: string) => {
  try {
    const stats = await VideoStats.findOne({ videoId });
    if (!stats) throw new Error("Stats not found for this video");
    return stats.toObject();
  } catch (error: any) {
    throw new Error(`Error fetching video stats: ${error.message}`);
  }
};

/**
 * Actualiza las estadísticas de un video.
 * @param videoId - ID del video
 * @param updateData - Nuevos datos a actualizar
 * @returns Estadísticas actualizadas
 */
export const updateVideoStats = async (videoId: string, updateData: any) => {
  try {
    const updated = await VideoStats.findOneAndUpdate({ videoId }, updateData, {
      new: true,
    });
    if (!updated) throw new Error("Stats not found for update");
    return updated.toObject();
  } catch (error: any) {
    throw new Error(`Error updating video stats: ${error.message}`);
  }
};

/**
 * Elimina las estadísticas de un video.
 * @param videoId - ID del video
 * @returns Mensaje de éxito
 */
export const deleteVideoStats = async (videoId: string) => {
  try {
    const deleted = await VideoStats.findOneAndDelete({ videoId });
    if (!deleted) throw new Error("Stats not found to delete");
    return { message: "Video stats deleted successfully" };
  } catch (error: any) {
    throw new Error(`Error deleting video stats: ${error.message}`);
  }
};
