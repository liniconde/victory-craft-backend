import { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../services/userService";
import { isDevMode } from "../utils/utils";

// Obtener todos los usuarios
export const handleGetUsers = async (req: Request, res: Response) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Obtener un usuario por ID
export const handleGetUserById = async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Registrar un nuevo usuario
export const handleRegisterUser = async (req: Request, res: Response) => {
  try {
    const { user, token } = await registerUser(req.body);
    res.status(201).json({ user, token });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Iniciar sesión
export const handleLoginUser = async (req: Request, res: Response) => {
  try {
    if (isDevMode()) {
      res.json({
        user: {
          email: "js.ve@gmail.com",
          createdAt: new Date(),
          updatedAt: new Date(),
          username: "string",
          password: "string",
          firstName: "string",
          lastName: "string",
          role: "admin",
          profileImage: "string",
        },
        token: "agsdhjkldf",
      });
      return;
    }
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
    }

    const { user, token } = await loginUser(email, password);
    res.json({ user, token });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};

// Actualizar un usuario
export const handleUpdateUser = async (req: Request, res: Response) => {
  try {
    const updatedUser = await updateUser(req.params.id, req.body);
    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
    }
    res.json(updatedUser);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Eliminar un usuario
export const handleDeleteUser = async (req: Request, res: Response) => {
  try {
    const deletedUser = await deleteUser(req.params.id);
    if (!deletedUser) {
      res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
