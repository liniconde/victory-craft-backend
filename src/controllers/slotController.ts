import { Request, Response } from "express";
import slotService from "../services/slotService";

/**
 * Crea un nuevo slot.
 * @param req - Request de Express con los datos del slot en el body.
 * @param res - Response de Express.
 */
export const handleCreateSlot = async (req: Request, res: Response) => {
  try {
    const slot = await slotService.createSlot(req.body);
    res.status(201).json(slot);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtiene un slot por su ID.
 * @param req - Request de Express con el ID del slot en los parámetros.
 * @param res - Response de Express.
 */
export const handleGetSlotById = async (req: Request, res: Response) => {
  try {
    const slot = await slotService.getSlotById(req.params.id as string);
    if (!slot) {
      res.status(404).json({ message: "Slot not found" });
    }
    res.status(200).json(slot);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtiene un slot por su ID.
 * @param req - Request de Express con el ID del slot en los parámetros.
 * @param res - Response de Express.
 */
export const handleGetSlots = async (req: Request, res: Response) => {
  try {
    const slot = await slotService.getSlots();
    if (!slot) {
      res.status(404).json({ message: "Slots not found" });
    }
    res.status(200).json(slot);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtiene todos los slots asociados a un campo específico.
 * @param req - Request de Express con el `fieldId` en los parámetros.
 * @param res - Response de Express.
 */
export const handleGetSlotsByFieldId = async (req: Request, res: Response) => {
  try {
    const fieldId = req.params.id;
    const slots = await slotService.getSlotsByFieldId(fieldId as string);
    res.status(200).json(slots);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualiza un slot por su ID.
 * @param req - Request de Express con el ID del slot y los datos a actualizar.
 * @param res - Response de Express.
 */
export const handleUpdateSlot = async (req: Request, res: Response) => {
  try {
    const updatedSlot = await slotService.updateSlot(req.params.id as string, req.body);
    if (!updatedSlot) {
      res.status(404).json({ message: "Slot not found" });
    }
    res.status(200).json(updatedSlot);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Elimina un slot por su ID.
 * @param req - Request de Express con el ID del slot en los parámetros.
 * @param res - Response de Express.
 */
export const handleDeleteSlot = async (req: Request, res: Response) => {
  try {
    const deletedSlot = await slotService.deleteSlot(req.params.id as string);
    if (!deletedSlot) {
      res.status(404).json({ message: "Slot not found" });
    }
    res.status(204).json({ message: "Slot deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
