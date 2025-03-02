import express from "express";
import {
  handleCreateReservation,
  handleGetReservationById,
  handleUpdateReservation,
  handleDeleteReservation,
  handleGetAllReservations,
  handleGetReservationsByUser,
} from "../controllers/reservationController";

const router = express.Router();

// Definir rutas y conectarlas con el controlador
router.get("/", handleGetAllReservations);
router.get("/:id", handleGetReservationById);
router.get("/user/:id", handleGetReservationsByUser);
router.post("/", handleCreateReservation);
router.put("/:id", handleUpdateReservation);
router.delete("/:id", handleDeleteReservation);

export default router;
