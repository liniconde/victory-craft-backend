import { Types } from "mongoose";
import Field from "../models/Field";
import { getObjectS3SignedUrl } from "./s3FilesService";
import Slot from "../models/Slot";
import Video from "../models/Video";

/**
 * Obtiene todos los videos de una campo y les agrega la URL firmada.
 * @param fieldId - ID de la campo.
 * @returns Lista de videos con URLs firmadas.
 */
export const getFieldVideos = async (fieldId: string) => {
  try {
    const videos = await Video.find({ fieldId }); // Busca los videos de la campo

    if (!videos.length) {
      return [];
    }

    // Generar URLs firmadas para cada video
    const videosWithUrls = await Promise.all(
      videos.map(async (video) => ({
        _id: video._id,
        fieldId: video.fieldId,
        s3Key: video.s3Key,
        uploadedAt: video.uploadedAt,
        videoUrl: getObjectS3SignedUrl(video.s3Key), // URL firmada de S3
      }))
    );

    return videosWithUrls;
  } catch (error: any) {
    throw new Error(`Error fetching field videos: ${error.message}`);
  }
};

// Crear un nuevo campo
export const createField = async (fieldData: any) => {
  try {
    const field = await Field.create(fieldData);
    return updateImageSignedUrl(field);
  } catch (error) {
    throw new Error(`Error creating field: ${error.message}`);
  }
};

// Obtener un campo por ID
export const getFieldById = async (id: string) => {
  try {
    const field = await Field.findById(id);
    if (!field) throw new Error("Field not found");
    return updateImageSignedUrl(field);
  } catch (error) {
    throw new Error(`Error fetching field: ${error.message}`);
  }
};

// Obtener un campo por ID
export const getFieldsByUserId = async (userId: string) => {
  try {
    const query = userId ? { owner: new Types.ObjectId(userId) } : {};
    const fields = await Field.find(query);
    return fields.map(updateImageSignedUrl);
  } catch (error) {
    throw new Error(`Error fetching field: ${error.message}`);
  }
};

// Actualizar un campo por ID
export const updateField = async (id: string, updateData: any) => {
  try {
    const field = await Field.findByIdAndUpdate(id, updateData, { new: true });
    if (!field) throw new Error("Field not found");
    return updateImageSignedUrl(field);
  } catch (error) {
    throw new Error(`Error updating field: ${error.message}`);
  }
};

// Eliminar un campo por ID
export const deleteField = async (id: any) => {
  try {
    const field = await Field.findByIdAndDelete(id);
    if (!field) throw new Error("Field not found");
    return { message: "Field deleted successfully" };
  } catch (error) {
    throw new Error(`Error deleting field: ${error.message}`);
  }
};

// Obtener todos los campos
export const getAllFields = async () => {
  try {
    const fields = await Field.find();
    return fields.map(updateImageSignedUrl);
  } catch (error) {
    throw new Error(`Error fetching fields: ${error.message}`);
  }
};

// Agregar URL firmada de S3 al campo
const updateImageSignedUrl = (field: any) => {
  if (!field.imageS3Key) return field;
  const imageUrl = getObjectS3SignedUrl(field.imageS3Key);
  return { ...field.toObject(), imageUrl }; // Convertir el documento a objeto y agregar la URL
};

/**
 * Obtiene todos los slots, opcionalmente filtrados por campo (`fieldId`).
 * @param fieldId - ID del campo para filtrar los slots (opcional).
 * @returns Lista de slots.
 */
export const getFieldSlots = async (fieldId: string) => {
  try {
    const query = fieldId ? { field: new Types.ObjectId(fieldId) } : {};
    return await Slot.find(query).populate("field", "name location");
  } catch (error: any) {
    throw new Error(`Error fetching slots: ${error.message}`);
  }
};
