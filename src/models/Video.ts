import mongoose, { Schema, Document } from "mongoose";

// Interfaz para TypeScript
interface IVideo extends Document {
  fieldId: mongoose.Types.ObjectId; // Referencia a Field
  slotId: mongoose.Types.ObjectId;
  s3Key: string; // Identificador en S3
  s3Url?: string; // URL pública o firmada de S3
  googleAiFileId?: string;
  uploadedAt: Date;
}

// Esquema de Mongoose
const VideoSchema = new Schema<IVideo>(
  {
    fieldId: { type: Schema.Types.ObjectId, ref: "Field", required: true },
    slotId: { type: Schema.Types.ObjectId, ref: "Slot", required: true },
    s3Key: { type: String, required: true },
    s3Url: { type: String },
    googleAiFileId: { type: String }, // Store Google AI File ID
  },
  { timestamps: { createdAt: "uploadedAt" } } // Define `uploadedAt` automáticamente
);

export default mongoose.model<IVideo>("Video", VideoSchema);
