"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReservationsByUserId = exports.getAllReservations = exports.deleteReservation = exports.updateReservation = exports.getReservationById = exports.createReservation = void 0;
const Reservation_1 = __importDefault(require("../models/Reservation"));
const mongoose_1 = require("mongoose");
/**
 * Crea una nueva reserva.
 * @param reservationData - Datos de la reserva.
 * @returns La reserva creada.
 */
const createReservation = (reservationData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reservation = yield Reservation_1.default.create({
            user: new mongoose_1.Types.ObjectId(reservationData.user),
            slot: new mongoose_1.Types.ObjectId(reservationData.slot),
        });
        return reservation;
    }
    catch (error) {
        throw new Error(`Error creating reservation: ${error.message}`);
    }
});
exports.createReservation = createReservation;
/**
 * Obtiene una reserva por su ID.
 * @param id - ID de la reserva.
 * @returns La reserva encontrada o error si no existe.
 */
const getReservationById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reservation = yield Reservation_1.default.findById(id)
            .populate("user", "username email")
            .populate({
            path: "slot",
            populate: { path: "field" },
        });
        if (!reservation)
            throw new Error("Reservation not found");
        return reservation;
    }
    catch (error) {
        throw new Error(`Error fetching reservation: ${error.message}`);
    }
});
exports.getReservationById = getReservationById;
/**
 * Actualiza una reserva por ID.
 * @param id - ID de la reserva a actualizar.
 * @param updateData - Datos a actualizar.
 * @returns La reserva actualizada.
 */
const updateReservation = (id, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reservation = yield Reservation_1.default.findByIdAndUpdate(id, {
            user: updateData.user ? new mongoose_1.Types.ObjectId(updateData.user) : undefined,
            slot: updateData.slot ? new mongoose_1.Types.ObjectId(updateData.slot) : undefined,
        }, { new: true })
            .populate("user", "username email")
            .populate({
            path: "slot",
            populate: { path: "field", select: "name location type" },
        });
        if (!reservation)
            throw new Error("Reservation not found");
        return reservation;
    }
    catch (error) {
        throw new Error(`Error updating reservation: ${error.message}`);
    }
});
exports.updateReservation = updateReservation;
/**
 * Elimina una reserva por ID.
 * @param id
 * @returns
 */
const deleteReservation = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reservation = yield Reservation_1.default.findByIdAndDelete(id);
        if (!reservation)
            throw new Error("Reservation not found");
        return { message: "Reservation deleted successfully" };
    }
    catch (error) {
        throw new Error(`Error deleting reservation: ${error.message}`);
    }
});
exports.deleteReservation = deleteReservation;
/**
 * Obtiene todas las reservas.
 * @returns
 */
const getAllReservations = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reservations = yield Reservation_1.default.find()
            .populate("user", "username email")
            .populate({
            path: "slot",
            populate: { path: "field", model: "Field" },
        });
        console.log("reservations", reservations[0].user);
        return reservations;
    }
    catch (error) {
        throw new Error(`Error fetching reservations: ${error.message}`);
    }
});
exports.getAllReservations = getAllReservations;
/**
 * Obtiene todas las reservas de un usuario específico.
 * @param userId - ID del usuario.
 * @returns Lista de reservas del usuario.
 */
const getReservationsByUserId = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield Reservation_1.default.find({ user: new mongoose_1.Types.ObjectId(userId) })
            .populate("user", "username email")
            .populate({
            path: "slot",
            populate: { path: "field", select: "name location type" },
        });
    }
    catch (error) {
        throw new Error(`Error fetching reservations for user ${userId}: ${error.message}`);
    }
});
exports.getReservationsByUserId = getReservationsByUserId;
//# sourceMappingURL=reservationService.js.map