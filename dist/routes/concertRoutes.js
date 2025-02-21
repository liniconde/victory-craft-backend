"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const concertController_1 = require("../controllers/concertController");
const router = express_1.default.Router();
// Definir rutas y conectarlas con el controlador
router.get("/", concertController_1.getConcerts);
router.get("/:id", concertController_1.getConcertById);
router.post("/", concertController_1.createConcert);
router.put("/:id", concertController_1.updateConcert);
router.delete("/:id", concertController_1.deleteConcert);
exports.default = router;
//# sourceMappingURL=concertRoutes.js.map