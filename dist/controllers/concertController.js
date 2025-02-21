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
exports.deleteConcert = exports.updateConcert = exports.createConcert = exports.getConcertById = exports.getConcerts = void 0;
const Concert_1 = __importDefault(require("../models/Concert"));
// Obtener todos los conciertos
const getConcerts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const concerts = yield Concert_1.default.find();
        res.json(concerts);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getConcerts = getConcerts;
// Obtener un concierto por ID
const getConcertById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const concert = yield Concert_1.default.findById(req.params.id);
        if (!concert) {
            res.status(400).json({
                message: "Concert not found",
            });
        }
        res.json(concert);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getConcertById = getConcertById;
// Crear un nuevo concierto
const createConcert = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newConcert = new Concert_1.default(req.body);
        yield newConcert.save();
        res.status(201).json(newConcert);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});
exports.createConcert = createConcert;
// Actualizar un concierto
const updateConcert = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedConcert = yield Concert_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedConcert);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});
exports.updateConcert = updateConcert;
// Eliminar un concierto
const deleteConcert = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Concert_1.default.findByIdAndDelete(req.params.id);
        res.json({ message: "Concert deleted" });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.deleteConcert = deleteConcert;
//# sourceMappingURL=concertController.js.map