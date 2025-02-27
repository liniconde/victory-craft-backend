import mongoose, { Schema, Document } from "mongoose";

// Interfaz para TypeScript
interface IField extends Document {
  name: string;
  type: "football" | "padel" | "tennis";
  location: string;
  pricePerHour: number;
  imageS3Key: string;
  imageUrl?: string;
  owner: mongoose.Types.ObjectId; // Referencia a User
  createdAt: Date;
  updatedAt: Date;
}

// Esquema de Mongoose
const FieldSchema = new Schema<IField>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["football", "padel", "tennis"],
      required: true,
    },
    location: { type: String, required: true },
    pricePerHour: { type: Number, required: true },
    imageS3Key: { type: String, required: true },
    imageUrl: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Relación con User
  },
  { timestamps: true } // Agrega `createdAt` y `updatedAt` automáticamente
);

export default mongoose.model<IField>("Field", FieldSchema);
