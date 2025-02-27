import { Request, Response } from "express";
import User from "../models/User";

// Obtener todos los conciertos
export const getUsers = async () => {
  return User.find();
};

// Obtener un concierto por ID
export const getUserById = async (id: string) => {
  return User.findById(id);
};

// Crear un nuevo concierto
export const createUser = async (user: any) => {
  const newUser = new User(user);
  return newUser.save();
};

// Actualizar un concierto
export const updateUser = async (id: string, user: any) => {
  const updatedUser = await User.findByIdAndUpdate(id, user, {
    new: true,
  });
  return updatedUser;
};

// Eliminar un concierto
export const deleteUser = async (id: string) => {
  return User.findByIdAndDelete(id);
};
