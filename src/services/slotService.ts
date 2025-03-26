import Slot from "../models/Slot";
import { Types } from "mongoose";

interface SlotData {
  field: string;
  startTime: Date;
  endTime: Date;
  isAvailable?: boolean;
  value: number;
}

class SlotService {
  /**
   * Crea un nuevo slot.
   * @param slotData - Datos del slot.
   * @returns Slot creado.
   */
  async createSlot(slotData: SlotData) {
    try {
      const slot = await Slot.create({
        ...slotData,
        field: new Types.ObjectId(slotData.field),
      });
      return slot;
    } catch (error: any) {
      throw new Error(`Error creating slot: ${error.message}`);
    }
  }

  /**
   * Obtiene un slot por su ID.
   * @param slotId - ID del slot.
   * @returns Slot encontrado o error si no existe.
   */
  async getSlotById(slotId: string) {
    try {
      const slot = await Slot.findById(slotId).populate(
        "field",
        "name location"
      );
      if (!slot) {
        throw new Error("Slot not found");
      }
      return slot;
    } catch (error: any) {
      throw new Error(`Error fetching slot: ${error.message}`);
    }
  }

  /**
   * Obtiene los slots de un campo específico.
   * @param fieldId - ID del campo.
   * @returns Lista de slots asociados al campo.
   */
  async getSlotsByFieldId(fieldId: string) {
    try {
      return await Slot.find({ field: new Types.ObjectId(fieldId) }).populate(
        "field",
        "name location"
      );
    } catch (error: any) {
      throw new Error(
        `Error fetching slots for field ${fieldId}: ${error.message}`
      );
    }
  }

  /**
   * Obtiene los slots de un campo específico.
   * @param fieldId - ID del campo.
   * @returns Lista de slots asociados al campo.
   */
  async getSlots() {
    try {
      return await Slot.find().populate("field", "name location");
    } catch (error: any) {
      throw new Error(`Error fetching slots for field: ${error.message}`);
    }
  }

  /**
   * Actualiza un slot por su ID.
   * @param slotId - ID del slot a actualizar.
   * @param slotData - Datos a actualizar.
   * @returns Slot actualizado.
   */
  async updateSlot(slotId: string, slotData: Partial<SlotData>) {
    try {
      const slot = await Slot.findByIdAndUpdate(slotId, slotData, {
        new: true,
      }).populate("field", "name location");
      if (!slot) {
        throw new Error("Slot not found");
      }
      return slot;
    } catch (error: any) {
      throw new Error(`Error updating slot: ${error.message}`);
    }
  }

  /**
   * Elimina un slot por su ID.
   * @param slotId - ID del slot a eliminar.
   * @returns Mensaje de éxito si se elimina correctamente.
   */
  async deleteSlot(slotId: string) {
    try {
      const slot = await Slot.findByIdAndDelete(slotId);
      if (!slot) {
        throw new Error("Slot not found");
      }
      return { message: "Slot deleted successfully" };
    } catch (error: any) {
      throw new Error(`Error deleting slot: ${error.message}`);
    }
  }
}

export default new SlotService();
