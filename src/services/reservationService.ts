import Reservation from "../models/Reservation";
import { Types } from "mongoose";

/**
 * Crea una nueva reserva.
 * @param reservationData - Datos de la reserva.
 * @returns La reserva creada.
 */
export const createReservation = async (reservationData: {
  user: string;
  slot: string;
}) => {
  try {
    const reservation = await Reservation.create({
      user: new Types.ObjectId(reservationData.user),
      slot: new Types.ObjectId(reservationData.slot),
    });

    return reservation;
  } catch (error: any) {
    throw new Error(`Error creating reservation: ${error.message}`);
  }
};

/**
 * Obtiene una reserva por su ID.
 * @param id - ID de la reserva.
 * @returns La reserva encontrada o error si no existe.
 */
export const getReservationById = async (id: string) => {
  try {
    const reservation = await Reservation.findById(id)
      .populate("user", "username email")
      .populate({
        path: "slot",
        populate: { path: "field" },
      });

    if (!reservation) throw new Error("Reservation not found");
    return reservation;
  } catch (error: any) {
    throw new Error(`Error fetching reservation: ${error.message}`);
  }
};

/**
 * Actualiza una reserva por ID.
 * @param id - ID de la reserva a actualizar.
 * @param updateData - Datos a actualizar.
 * @returns La reserva actualizada.
 */
export const updateReservation = async (
  id: string,
  updateData: Partial<{ user: string; slot: string }>
) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(
      id,
      {
        user: updateData.user ? new Types.ObjectId(updateData.user) : undefined,
        slot: updateData.slot ? new Types.ObjectId(updateData.slot) : undefined,
      },
      { new: true }
    )
      .populate("user", "username email")
      .populate({
        path: "slot",
        populate: { path: "field", select: "name location type" },
      });

    if (!reservation) throw new Error("Reservation not found");
    return reservation;
  } catch (error: any) {
    throw new Error(`Error updating reservation: ${error.message}`);
  }
};

/**
 * Elimina una reserva por ID.
 * @param id
 * @returns
 */
export const deleteReservation = async (id: string) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(id);
    if (!reservation) throw new Error("Reservation not found");
    return { message: "Reservation deleted successfully" };
  } catch (error: any) {
    throw new Error(`Error deleting reservation: ${error.message}`);
  }
};

/**
 * Obtiene todas las reservas.
 * @returns
 */
export const getAllReservations = async () => {
  try {
    const reservations = await Reservation.find()
      .populate("user", "username email")
      .populate({
        path: "slot",
        populate: { path: "field", model: "Field" },
      });
    console.log("reservations", reservations[0].user);
    return reservations;
  } catch (error: any) {
    throw new Error(`Error fetching reservations: ${error.message}`);
  }
};

/**
 * Obtiene todas las reservas de un usuario específico.
 * @param userId - ID del usuario.
 * @returns Lista de reservas del usuario.
 */
export const getReservationsByUserId = async (userId: string) => {
  try {
    return await Reservation.find({ user: new Types.ObjectId(userId) })
      .populate("user", "username email")
      .populate({
        path: "slot",
        populate: { path: "field", select: "name location type" },
      });
  } catch (error: any) {
    throw new Error(
      `Error fetching reservations for user ${userId}: ${error.message}`
    );
  }
};
