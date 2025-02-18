import mongoose from "mongoose";

const ConcertSchema = new mongoose.Schema({
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

export default mongoose.model("Concert", ConcertSchema);
