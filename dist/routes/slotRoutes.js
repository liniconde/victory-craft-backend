"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const slotController_1 = require("../controllers/slotController");
const router = express_1.default.Router();
// Definir rutas y conectarlas con el controlador
router.get("/:id", slotController_1.handleGetSlotById);
router.get("/:id/field", slotController_1.handleGetSlotsByFieldId);
router.post("/", slotController_1.handleCreateSlot);
router.get("/", slotController_1.handleGetSlots);
router.put("/:id", slotController_1.handleUpdateSlot);
router.delete("/:id", slotController_1.handleDeleteSlot);
exports.default = router;
//# sourceMappingURL=slotRoutes.js.map