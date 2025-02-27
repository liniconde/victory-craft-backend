import mongoose, { Schema, Document } from "mongoose";

// Interfaz para TypeScript
interface ISlot extends Document {
  field: mongoose.Types.ObjectId; // Relación con Field
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

// Esquema de Mongoose
const SlotSchema = new Schema<ISlot>(
  {
    field: { type: Schema.Types.ObjectId, ref: "Field", required: true }, // Relación con Field
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    isAvailable: { type: Boolean, required: true, default: true },
    value: { type: Number, required: true },
  },
  { timestamps: true } // Agrega `createdAt` y `updatedAt` automáticamente
);

// Validación: `endTime` debe ser mayor que `startTime`
SlotSchema.pre("save", function (next) {
  if (this.endTime <= this.startTime) {
    return next(new Error("endTime must be greater than startTime"));
  }
  next();
});

export default mongoose.model<ISlot>("Slot", SlotSchema);
