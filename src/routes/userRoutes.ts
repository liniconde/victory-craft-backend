import express from "express";
import {
  handleGetUsers,
  handleGetUserById,
  handleUpdateUser,
  handleDeleteUser,
} from "../controllers/userController";

const router = express.Router();

// Definir rutas y conectarlas con el controlador
router.get("/", handleGetUsers);
router.get("/:id", handleGetUserById);
router.put("/:id", handleUpdateUser);
router.delete("/:id", handleDeleteUser);

export default router;
