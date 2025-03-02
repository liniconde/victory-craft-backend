import express from "express";
import { handleUploadImage, handleGetImage } from "../controllers/imagesController";

const router = express.Router();

// Definir rutas y conectarlas con el controlador
router.post("/upload", handleUploadImage);
router.post("/get", handleGetImage);

export default router;
