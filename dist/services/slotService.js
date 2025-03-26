"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Slot_1 = __importDefault(require("../models/Slot"));
const mongoose_1 = require("mongoose");
class SlotService {
    /**
     * Crea un nuevo slot.
     * @param slotData - Datos del slot.
     * @returns Slot creado.
     */
    createSlot(slotData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const slot = yield Slot_1.default.create(Object.assign(Object.assign({}, slotData), { field: new mongoose_1.Types.ObjectId(slotData.field) }));
                return slot;
            }
            catch (error) {
                throw new Error(`Error creating slot: ${error.message}`);
            }
        });
    }
    /**
     * Obtiene un slot por su ID.
     * @param slotId - ID del slot.
     * @returns Slot encontrado o error si no existe.
     */
    getSlotById(slotId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const slot = yield Slot_1.default.findById(slotId).populate("field", "name location");
                if (!slot) {
                    throw new Error("Slot not found");
                }
                return slot;
            }
            catch (error) {
                throw new Error(`Error fetching slot: ${error.message}`);
            }
        });
    }
    /**
     * Obtiene los slots de un campo específico.
     * @param fieldId - ID del campo.
     * @returns Lista de slots asociados al campo.
     */
    getSlotsByFieldId(fieldId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield Slot_1.default.find({ field: new mongoose_1.Types.ObjectId(fieldId) }).populate("field", "name location");
            }
            catch (error) {
                throw new Error(`Error fetching slots for field ${fieldId}: ${error.message}`);
            }
        });
    }
    /**
     * Obtiene los slots de un campo específico.
     * @param fieldId - ID del campo.
     * @returns Lista de slots asociados al campo.
     */
    getSlots() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield Slot_1.default.find().populate("field", "name location");
            }
            catch (error) {
                throw new Error(`Error fetching slots for field: ${error.message}`);
            }
        });
    }
    /**
     * Actualiza un slot por su ID.
     * @param slotId - ID del slot a actualizar.
     * @param slotData - Datos a actualizar.
     * @returns Slot actualizado.
     */
    updateSlot(slotId, slotData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const slot = yield Slot_1.default.findByIdAndUpdate(slotId, slotData, {
                    new: true,
                }).populate("field", "name location");
                if (!slot) {
                    throw new Error("Slot not found");
                }
                return slot;
            }
            catch (error) {
                throw new Error(`Error updating slot: ${error.message}`);
            }
        });
    }
    /**
     * Elimina un slot por su ID.
     * @param slotId - ID del slot a eliminar.
     * @returns Mensaje de éxito si se elimina correctamente.
     */
    deleteSlot(slotId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const slot = yield Slot_1.default.findByIdAndDelete(slotId);
                if (!slot) {
                    throw new Error("Slot not found");
                }
                return { message: "Slot deleted successfully" };
            }
            catch (error) {
                throw new Error(`Error deleting slot: ${error.message}`);
            }
        });
    }
}
exports.default = new SlotService();
//# sourceMappingURL=slotService.js.map