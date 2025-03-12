"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reservationController_1 = require("../controllers/reservationController");
const router = express_1.default.Router();
// Definir rutas y conectarlas con el controlador
router.get("/", reservationController_1.handleGetAllReservations);
router.get("/:id", reservationController_1.handleGetReservationById);
router.get("/user/:id", reservationController_1.handleGetReservationsByUser);
router.post("/", reservationController_1.handleCreateReservation);
router.put("/:id", reservationController_1.handleUpdateReservation);
router.delete("/:id", reservationController_1.handleDeleteReservation);
exports.default = router;
//# sourceMappingURL=reservationRoutes.js.map