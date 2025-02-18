import express from "express";
import { getConcerts, getConcertById, createConcert, updateConcert, deleteConcert } from "../controllers/concertController";

const router = express.Router();

// Definir rutas y conectarlas con el controlador
router.get("/", getConcerts);
router.get("/:id", getConcertById);
router.post("/", createConcert);
router.put("/:id", updateConcert);
router.delete("/:id", deleteConcert);

export default router;

