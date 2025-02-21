"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ConcertSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    ensemble: { type: String, required: true },
    repertoire: [{ type: String, required: true }], // Lista de canciones
    date: { type: Date, required: true },
    location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
    },
    venue: { type: String, required: true }, // Nombre del lugar
    ticketPrice: { type: Number, required: true },
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    imageUrl: { type: String },
});
exports.default = mongoose_1.default.model("Concert", ConcertSchema);
//# sourceMappingURL=Concert.js.map