import { Request, Response } from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../services/userService";

// Obtener todos los conciertos
export const handleGetUsers = async (req: Request, res: Response) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Obtener un concierto por ID
export const handleGetUserById = async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      res.status(400).json({
        message: "User not found",
      });
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Crear un nuevo concierto
export const handleCreateUser = async (req: Request, res: Response) => {
  try {
    const newUser = createUser(req.body);
    res.status(201).json(newUser);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Actualizar un concierto
export const handleUpdateUser = async (req: Request, res: Response) => {
  try {
    const updatedUser = await updateUser(req.params.id, req.body);
    res.json(updatedUser);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Eliminar un concierto
export const handleDeleteUser = async (req: Request, res: Response) => {
  try {
    await deleteUser(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
