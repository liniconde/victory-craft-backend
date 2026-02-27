import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import concertRoutes from "./routes/concertRoutes";
import userRoutes from "./routes/userRoutes";
import fieldRoutes from "./routes/fieldRoutes";
import slotRoutes from "./routes/slotRoutes";
import imageRoutes from "./routes/imageRoutes";
import reservationRoutes from "./routes/reservationRoutes";
import videoRoutes from "./routes/videoRoutes";
import videoStatsRoutes from "./routes/videoStatsRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;
const mongoUri = process.env.MONGO_URI_3 || process.env.MONGO_URI;

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar con MongoDB
if (mongoUri) {
  mongoose
    .connect(mongoUri)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("MongoDB connection error:", err));
} else {
  console.warn("⚠️ MongoDB URI not found (MONGO_URI_3 or MONGO_URI).");
}

app.use("/concerts", concertRoutes);
app.use("/images", imageRoutes);
app.use("/users", userRoutes);
app.use("/fields", fieldRoutes);
app.use("/slots", slotRoutes);
app.use("/reservations", reservationRoutes);
app.use("/videos", videoRoutes);
app.use("/video-stats", videoStatsRoutes);

// Export app for Vercel
export default app;

// Start server only if run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}
