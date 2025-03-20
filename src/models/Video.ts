import mongoose, { Schema, Document } from "mongoose";

// Interfaz para TypeScript
interface IVideo extends Document {
  fieldId: mongoose.Types.ObjectId; // Referencia a Field
  s3Key: string; // Identificador en S3
  s3Url?: string; // URL pública o firmada de S3
  uploadedAt: Date;
}

// Esquema de Mongoose
const VideoSchema = new Schema<IVideo>(
  {
    fieldId: { type: Schema.Types.ObjectId, ref: "Field", required: true },
    s3Key: { type: String, required: true },
    s3Url: { type: String },
  },
  { timestamps: { createdAt: "uploadedAt" } } // Define `uploadedAt` automáticamente
);

export default mongoose.model<IVideo>("Video", VideoSchema);
