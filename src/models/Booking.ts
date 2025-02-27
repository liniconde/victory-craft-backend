import mongoose, { Schema, Document } from "mongoose";

// Interfaz para TypeScript
interface IBooking extends Document {
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  user: mongoose.Types.ObjectId; // Referencia a User
  field: mongoose.Types.ObjectId; // Referencia a Field
  createdAt: Date;
  updatedAt: Date;
}

// Esquema de Mongoose
const BookingSchema = new Schema<IBooking>(
  {
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Relación con User
    field: { type: Schema.Types.ObjectId, ref: "Field", required: true }, // Relación con Field
  },
  { timestamps: true } // Agrega `createdAt` y `updatedAt` automáticamente
);

export default mongoose.model<IBooking>("Booking", BookingSchema);
