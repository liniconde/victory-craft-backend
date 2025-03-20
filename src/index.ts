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

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar con MongoDB
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error(err));

app.use("/concerts", concertRoutes);
app.use("/images", imageRoutes);
app.use("/users", userRoutes);
app.use("/fields", fieldRoutes);
app.use("/slots", slotRoutes);
app.use("/reservations", reservationRoutes);
app.use("/videos", videoRoutes);

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
