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
exports.getFieldSlots = exports.getAllFields = exports.deleteField = exports.updateField = exports.getFieldById = exports.createField = exports.getFieldVideos = void 0;
const mongoose_1 = require("mongoose");
const Field_1 = __importDefault(require("../models/Field"));
const s3FilesService_1 = require("./s3FilesService");
const Slot_1 = __importDefault(require("../models/Slot"));
const Video_1 = __importDefault(require("../models/Video"));
/**
 * Obtiene todos los videos de una cancha y les agrega la URL firmada.
 * @param fieldId - ID de la cancha.
 * @returns Lista de videos con URLs firmadas.
 */
const getFieldVideos = (fieldId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const videos = yield Video_1.default.find({ fieldId }); // Busca los videos de la cancha
        if (!videos.length) {
            return [];
        }
        // Generar URLs firmadas para cada video
        const videosWithUrls = yield Promise.all(videos.map((video) => __awaiter(void 0, void 0, void 0, function* () {
            return ({
                _id: video._id,
                fieldId: video.fieldId,
                s3Key: video.s3Key,
                uploadedAt: video.uploadedAt,
                videoUrl: (0, s3FilesService_1.getObjectS3SignedUrl)(video.s3Key), // URL firmada de S3
            });
        })));
        return videosWithUrls;
    }
    catch (error) {
        throw new Error(`Error fetching field videos: ${error.message}`);
    }
});
exports.getFieldVideos = getFieldVideos;
// Crear un nuevo campo
const createField = (fieldData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const field = yield Field_1.default.create(fieldData);
        return updateImageSignedUrl(field);
    }
    catch (error) {
        throw new Error(`Error creating field: ${error.message}`);
    }
});
exports.createField = createField;
// Obtener un campo por ID
const getFieldById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const field = yield Field_1.default.findById(id);
        if (!field)
            throw new Error("Field not found");
        return updateImageSignedUrl(field);
    }
    catch (error) {
        throw new Error(`Error fetching field: ${error.message}`);
    }
});
exports.getFieldById = getFieldById;
// Actualizar un campo por ID
const updateField = (id, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const field = yield Field_1.default.findByIdAndUpdate(id, updateData, { new: true });
        if (!field)
            throw new Error("Field not found");
        return updateImageSignedUrl(field);
    }
    catch (error) {
        throw new Error(`Error updating field: ${error.message}`);
    }
});
exports.updateField = updateField;
// Eliminar un campo por ID
const deleteField = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const field = yield Field_1.default.findByIdAndDelete(id);
        if (!field)
            throw new Error("Field not found");
        return { message: "Field deleted successfully" };
    }
    catch (error) {
        throw new Error(`Error deleting field: ${error.message}`);
    }
});
exports.deleteField = deleteField;
// Obtener todos los campos
const getAllFields = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fields = yield Field_1.default.find();
        return fields.map(updateImageSignedUrl);
    }
    catch (error) {
        throw new Error(`Error fetching fields: ${error.message}`);
    }
});
exports.getAllFields = getAllFields;
// Agregar URL firmada de S3 al campo
const updateImageSignedUrl = (field) => {
    if (!field.imageS3Key)
        return field;
    const imageUrl = (0, s3FilesService_1.getObjectS3SignedUrl)(field.imageS3Key);
    return Object.assign(Object.assign({}, field.toObject()), { imageUrl }); // Convertir el documento a objeto y agregar la URL
};
/**
 * Obtiene todos los slots, opcionalmente filtrados por campo (`fieldId`).
 * @param fieldId - ID del campo para filtrar los slots (opcional).
 * @returns Lista de slots.
 */
const getFieldSlots = (fieldId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = fieldId ? { field: new mongoose_1.Types.ObjectId(fieldId) } : {};
        return yield Slot_1.default.find(query).populate("field", "name location");
    }
    catch (error) {
        throw new Error(`Error fetching slots: ${error.message}`);
    }
});
exports.getFieldSlots = getFieldSlots;
//# sourceMappingURL=fieldService.js.map