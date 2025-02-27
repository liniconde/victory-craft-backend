import Field from "../models/Field.js";
import { getObjectS3SignedUrl } from "./imagesService.js";


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
