import { Request, Response } from "express";
import {
  createField,
  getFieldById,
  getAllFields,
  updateField,
  deleteField,
} from "../services/fieldService";

// Obtener todos los campos
export const handleGetFields = async (req: Request, res: Response) => {
  try {
    const fields = await getAllFields();
    res.json(fields);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Obtener un campo por ID
export const handleGetFieldById = async (req: Request, res: Response) => {
  try {
    const field = await getFieldById(req.params.id);
    if (!field) {
      res.status(404).json({ message: "Field not found" });
    }
    res.json(field);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Crear un nuevo campo
export const handleCreateField = async (req: Request, res: Response) => {
  try {
    const newField = await createField(req.body);
    res.status(201).json(newField);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Actualizar un campo
export const handleUpdateField = async (req: Request, res: Response) => {
  try {
    const updatedField = await updateField(req.params.id, req.body);
    if (!updatedField) {
       res.status(404).json({ message: "Field not found" });
    }
    res.json(updatedField);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Eliminar un campo
export const handleDeleteField = async (req: Request, res: Response) => {
  try {
    const deletedField = await deleteField(req.params.id);
    if (!deletedField) {
       res.status(404).json({ message: "Field not found" });
    }
    res.json({ message: "Field deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
