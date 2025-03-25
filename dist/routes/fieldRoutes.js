"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fieldController_1 = require("../controllers/fieldController");
const fieldController_2 = require("../controllers/fieldController");
const router = express_1.default.Router();
// Definir rutas y conectarlas con el controlador
router.get("/", fieldController_1.handleGetFields);
router.get("/:id", fieldController_1.handleGetFieldById);
router.get("/users/:userId", fieldController_1.handleGetFieldsByUserId);
router.post("/", fieldController_1.handleCreateField);
router.put("/:id", fieldController_1.handleUpdateField);
router.delete("/:id", fieldController_1.handleDeleteField);
router.get("/:id/slots", fieldController_2.handleGetFieldSlots);
router.get("/:id/videos", fieldController_1.handleGetFieldVideos);
exports.default = router;
//# sourceMappingURL=fieldRoutes.js.map