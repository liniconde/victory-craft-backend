import mongoose, { Schema, Document } from "mongoose";

// Interfaz para TypeScript
interface IVideo extends Document {
  fieldId?: mongoose.Types.ObjectId; // Referencia a Field (opcional para videos de biblioteca)
  slotId?: mongoose.Types.ObjectId;
  videoType: "field" | "library";
  sportType?: "football" | "padel" | "tennis" | "basketball" | "other";
  s3Key: string; // Identificador en S3
  s3Url?: string; // URL pública o firmada de S3
  googleAiFileId?: string;
  uploadedAt: Date;
}

// Esquema de Mongoose
const VideoSchema = new Schema<IVideo>(
  {
    fieldId: { type: Schema.Types.ObjectId, ref: "Field", required: false },
    slotId: { type: Schema.Types.ObjectId, ref: "Slot", required: false },
    videoType: {
      type: String,
      enum: ["field", "library"],
      default: "field",
      required: false,
    },
    sportType: {
      type: String,
      enum: ["football", "padel", "tennis", "basketball", "other"],
      required: false,
    },
    s3Key: { type: String, required: true },
    s3Url: { type: String },
    googleAiFileId: { type: String }, // Store Google AI File ID
  },
  { timestamps: { createdAt: "uploadedAt" } } // Define `uploadedAt` automáticamente
);

export default mongoose.model<IVideo>("Video", VideoSchema);
