import express from "express";
import {
  handleCreateSlot,
  handleGetSlotById,
  handleGetSlotsByFieldId,
  handleUpdateSlot,
  handleDeleteSlot,
} from "../controllers/slotController";

const router = express.Router();

// Definir rutas y conectarlas con el controlador
router.get("/:id", handleGetSlotById);
router.get("/:id/field", handleGetSlotsByFieldId);
router.post("/", handleCreateSlot);
router.put("/:id", handleUpdateSlot);
router.delete("/:id", handleDeleteSlot);

export default router;
