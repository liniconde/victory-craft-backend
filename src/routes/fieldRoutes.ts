import express from "express";
import {
  handleGetFields,
  handleGetFieldById,
  handleCreateField,
  handleUpdateField,
  handleDeleteField,
  handleGetFieldVideos,
  handleGetFieldsByUserId
} from "../controllers/fieldController";
import { handleGetFieldSlots } from "../controllers/fieldController";

const router = express.Router();

// Definir rutas y conectarlas con el controlador
router.get("/", handleGetFields);
router.get("/:id", handleGetFieldById);
router.get("/users/:userId", handleGetFieldsByUserId);
router.post("/", handleCreateField);
router.put("/:id", handleUpdateField);
router.delete("/:id", handleDeleteField);
router.get("/:id/slots", handleGetFieldSlots);
router.get("/:id/videos", handleGetFieldVideos); 

export default router;
