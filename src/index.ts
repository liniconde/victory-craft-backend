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

const defaultCorsOrigins = [
  "https://victory-craft-front.vercel.app",
  "https://victory-craft-front-spa.vercel.app",
  "http://localhost:5173",
];

const envCorsOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const oauthRedirectOrigins = (process.env.OAUTH_ALLOWED_REDIRECT_URIS || "")
  .split(",")
  .map((uri) => uri.trim())
  .filter(Boolean)
  .map((uri) => {
    try {
      return new URL(uri).origin;
    } catch (_error) {
      return "";
    }
  })
  .filter(Boolean);

const allowedOrigins = new Set(
  (envCorsOrigins.length ? envCorsOrigins : [...oauthRedirectOrigins, ...defaultCorsOrigins])
    .filter(Boolean),
);

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
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
