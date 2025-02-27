import mongoose, { Schema, Document } from "mongoose";

// Interfaz para TypeScript
interface IReservation extends Document {
  user: mongoose.Types.ObjectId; // Referencia a User
  slot: mongoose.Types.ObjectId; // Referencia a Slot
  createdAt: Date;
  updatedAt: Date;
}

// Esquema de Mongoose
const ReservationSchema = new Schema<IReservation>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Relación con User
    slot: { type: Schema.Types.ObjectId, ref: "Slot", required: true }, // Relación con Slot
  },
  { timestamps: true } // Agrega `createdAt` y `updatedAt` automáticamente
);

export default mongoose.model<IReservation>("Reservation", ReservationSchema);
