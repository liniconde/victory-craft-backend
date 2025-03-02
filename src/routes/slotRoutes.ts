import express from "express";
import {
  handleCreateSlot,
  handleGetSlotById,
  handleGetAllSlots,
  handleGetSlotsByFieldId,
  handleUpdateSlot,
  handleDeleteSlot,
} from "../controllers/slotController";

const router = express.Router();

// Definir rutas y conectarlas con el controlador
router.get("/", handleGetAllSlots);
router.get("/:id", handleGetSlotById);
router.get("/field/:id", handleGetSlotsByFieldId);
router.post("/", handleCreateSlot);
router.put("/:id", handleUpdateSlot);
router.delete("/:id", handleDeleteSlot);

export default router;
