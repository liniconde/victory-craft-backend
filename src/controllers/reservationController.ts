import { Request, Response } from "express";
import {
  createReservation,
  getReservationById,
  updateReservation,
  deleteReservation,
  getAllReservations,
  getReservationsByUserId,
} from "../services/reservationService";

/**
 * Crea una nueva reserva.
 * @param req - Request de Express con los datos de la reserva en el body.
 * @param res - Response de Express.
 */
export const handleCreateReservation = async (req: Request, res: Response) => {
  try {
    const reservation = await createReservation(req.body);
    res.status(201).json(reservation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtiene una reserva por su ID.
 * @param req - Request de Express con el ID de la reserva en los parámetros.
 * @param res - Response de Express.
 */
export const handleGetReservationById = async (req: Request, res: Response) => {
  try {
    const reservation = await getReservationById(req.params.id as string); // Cast req.params.id
    if (!reservation) {
      res.status(404).json({ message: "Reservation not found" });
      return; // Added return for consistency
    }
    res.status(200).json(reservation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualiza una reserva por su ID.
 * @param req - Request de Express con el ID de la reserva y los datos a actualizar.
 * @param res - Response de Express.
 */
export const handleUpdateReservation = async (req: Request, res: Response) => {
  try {
    const updatedReservation = await updateReservation(req.params.id as string, req.body); // Cast req.params.id
    if (!updatedReservation) {
      res.status(404).json({ message: "Reservation not found" });
      return; // Added return for consistency
    }
    res.status(200).json(updatedReservation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Elimina una reserva por su ID.
 * @param req - Request de Express con el ID de la reserva en los parámetros.
 * @param res - Response de Express.
 */
export const handleDeleteReservation = async (req: Request, res: Response) => {
  try {
    const deletedReservation = await deleteReservation(req.params.id as string);
    if (!deletedReservation) {
      res.status(404).json({ message: "Reservation not found" });
    }
    res.status(204).json({ message: "Reservation deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtiene todas las reservas.
 * @param req - Request de Express.
 * @param res - Response de Express.
 */
export const handleGetAllReservations = async (req: Request, res: Response) => {
  try {
    const reservations = await getAllReservations();
    res.status(200).json(reservations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtiene todas las reservas de un usuario específico.
 * @param req - Request de Express con el ID del usuario en los parámetros.
 * @param res - Response de Express.
 */
export const handleGetReservationsByUser = async (
  req: Request,
  res: Response
) => {
  try {
    const reservations = await getReservationsByUserId(req.params.id as string);
    res.status(200).json(reservations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
