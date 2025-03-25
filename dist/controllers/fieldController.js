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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetFieldSlots = exports.handleDeleteField = exports.handleUpdateField = exports.handleCreateField = exports.handleGetFieldsByUserId = exports.handleGetFieldById = exports.handleGetFields = exports.handleGetFieldVideos = void 0;
const fieldService_1 = require("../services/fieldService");
// Obtener todos los videos de una campo
const handleGetFieldVideos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: fieldId } = req.params;
        const videos = yield (0, fieldService_1.getFieldVideos)(fieldId);
        res.status(200).json(videos);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.handleGetFieldVideos = handleGetFieldVideos;
// Obtener todos los campos
const handleGetFields = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fields = yield (0, fieldService_1.getAllFields)();
        res.json(fields);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.handleGetFields = handleGetFields;
// Obtener un campo por ID
const handleGetFieldById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const field = yield (0, fieldService_1.getFieldById)(req.params.id);
        if (!field) {
            res.status(404).json({ message: "Field not found" });
        }
        res.json(field);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.handleGetFieldById = handleGetFieldById;
// Obtener un campo por ID
const handleGetFieldsByUserId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fields = yield (0, fieldService_1.getFieldsByUserId)(req.params.userId);
        if (!fields) {
            res.status(404).json({ message: "Fields not found" });
        }
        res.json(fields);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.handleGetFieldsByUserId = handleGetFieldsByUserId;
// Crear un nuevo campo
const handleCreateField = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newField = yield (0, fieldService_1.createField)(req.body);
        res.status(201).json(newField);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});
exports.handleCreateField = handleCreateField;
// Actualizar un campo
const handleUpdateField = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedField = yield (0, fieldService_1.updateField)(req.params.id, req.body);
        if (!updatedField) {
            res.status(404).json({ message: "Field not found" });
        }
        res.json(updatedField);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});
exports.handleUpdateField = handleUpdateField;
// Eliminar un campo
const handleDeleteField = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedField = yield (0, fieldService_1.deleteField)(req.params.id);
        if (!deletedField) {
            res.status(404).json({ message: "Field not found" });
        }
        res.json({ message: "Field deleted successfully" });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.handleDeleteField = handleDeleteField;
/**
 * Obtiene todos los slots, opcionalmente filtrados por un campo (`fieldId`).
 * @param req - Request de Express con `fieldId` como parámetro de consulta (opcional).
 * @param res - Response de Express.
 */
const handleGetFieldSlots = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const slots = yield (0, fieldService_1.getFieldSlots)(req.params.id);
        res.status(200).json(slots);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.handleGetFieldSlots = handleGetFieldSlots;
//# sourceMappingURL=fieldController.js.map