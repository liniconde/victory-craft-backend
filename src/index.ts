import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar con MongoDB
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

// Rutas básicas
app.get("/", (req, res) => {
  res.send("Welcome to the Concert Routes API");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
