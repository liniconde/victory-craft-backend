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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetReservationsByUser = exports.handleGetAllReservations = exports.handleDeleteReservation = exports.handleUpdateReservation = exports.handleGetReservationById = exports.handleCreateReservation = void 0;
const reservationService_1 = require("../services/reservationService");
/**
 * Crea una nueva reserva.
 * @param req - Request de Express con los datos de la reserva en el body.
 * @param res - Response de Express.
 */
const handleCreateReservation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reservation = yield (0, reservationService_1.createReservation)(req.body);
        res.status(201).json(reservation);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.handleCreateReservation = handleCreateReservation;
/**
 * Obtiene una reserva por su ID.
 * @param req - Request de Express con el ID de la reserva en los parámetros.
 * @param res - Response de Express.
 */
const handleGetReservationById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reservation = yield (0, reservationService_1.getReservationById)(req.params.id);
        if (!reservation) {
            res.status(404).json({ message: "Reservation not found" });
        }
        res.status(200).json(reservation);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.handleGetReservationById = handleGetReservationById;
/**
 * Actualiza una reserva por su ID.
 * @param req - Request de Express con el ID de la reserva y los datos a actualizar.
 * @param res - Response de Express.
 */
const handleUpdateReservation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedReservation = yield (0, reservationService_1.updateReservation)(req.params.id, req.body);
        if (!updatedReservation) {
            res.status(404).json({ message: "Reservation not found" });
        }
        res.status(200).json(updatedReservation);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.handleUpdateReservation = handleUpdateReservation;
/**
 * Elimina una reserva por su ID.
 * @param req - Request de Express con el ID de la reserva en los parámetros.
 * @param res - Response de Express.
 */
const handleDeleteReservation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedReservation = yield (0, reservationService_1.deleteReservation)(req.params.id);
        if (!deletedReservation) {
            res.status(404).json({ message: "Reservation not found" });
        }
        res.status(204).json({ message: "Reservation deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.handleDeleteReservation = handleDeleteReservation;
/**
 * Obtiene todas las reservas.
 * @param req - Request de Express.
 * @param res - Response de Express.
 */
const handleGetAllReservations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reservations = yield (0, reservationService_1.getAllReservations)();
        res.status(200).json(reservations);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.handleGetAllReservations = handleGetAllReservations;
/**
 * Obtiene todas las reservas de un usuario específico.
 * @param req - Request de Express con el ID del usuario en los parámetros.
 * @param res - Response de Express.
 */
const handleGetReservationsByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reservations = yield (0, reservationService_1.getReservationsByUserId)(req.params.id);
        res.status(200).json(reservations);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.handleGetReservationsByUser = handleGetReservationsByUser;
//# sourceMappingURL=reservationController.js.map