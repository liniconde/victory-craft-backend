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
exports.handleDeleteSlot = exports.handleUpdateSlot = exports.handleGetSlotsByFieldId = exports.handleGetSlots = exports.handleGetSlotById = exports.handleCreateSlot = void 0;
const slotService_1 = __importDefault(require("../services/slotService"));
/**
 * Crea un nuevo slot.
 * @param req - Request de Express con los datos del slot en el body.
 * @param res - Response de Express.
 */
const handleCreateSlot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const slot = yield slotService_1.default.createSlot(req.body);
        res.status(201).json(slot);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.handleCreateSlot = handleCreateSlot;
/**
 * Obtiene un slot por su ID.
 * @param req - Request de Express con el ID del slot en los parámetros.
 * @param res - Response de Express.
 */
const handleGetSlotById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const slot = yield slotService_1.default.getSlotById(req.params.id);
        if (!slot) {
            res.status(404).json({ message: "Slot not found" });
        }
        res.status(200).json(slot);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.handleGetSlotById = handleGetSlotById;
/**
 * Obtiene un slot por su ID.
 * @param req - Request de Express con el ID del slot en los parámetros.
 * @param res - Response de Express.
 */
const handleGetSlots = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const slot = yield slotService_1.default.getSlots();
        if (!slot) {
            res.status(404).json({ message: "Slots not found" });
        }
        res.status(200).json(slot);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.handleGetSlots = handleGetSlots;
/**
 * Obtiene todos los slots asociados a un campo específico.
 * @param req - Request de Express con el `fieldId` en los parámetros.
 * @param res - Response de Express.
 */
const handleGetSlotsByFieldId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fieldId = req.params.id;
        const slots = yield slotService_1.default.getSlotsByFieldId(fieldId);
        res.status(200).json(slots);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.handleGetSlotsByFieldId = handleGetSlotsByFieldId;
/**
 * Actualiza un slot por su ID.
 * @param req - Request de Express con el ID del slot y los datos a actualizar.
 * @param res - Response de Express.
 */
const handleUpdateSlot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedSlot = yield slotService_1.default.updateSlot(req.params.id, req.body);
        if (!updatedSlot) {
            res.status(404).json({ message: "Slot not found" });
        }
        res.status(200).json(updatedSlot);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.handleUpdateSlot = handleUpdateSlot;
/**
 * Elimina un slot por su ID.
 * @param req - Request de Express con el ID del slot en los parámetros.
 * @param res - Response de Express.
 */
const handleDeleteSlot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedSlot = yield slotService_1.default.deleteSlot(req.params.id);
        if (!deletedSlot) {
            res.status(404).json({ message: "Slot not found" });
        }
        res.status(204).json({ message: "Slot deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.handleDeleteSlot = handleDeleteSlot;
//# sourceMappingURL=slotController.js.map