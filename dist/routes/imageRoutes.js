"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const imagesController_1 = require("../controllers/imagesController");
const router = express_1.default.Router();
// Definir rutas y conectarlas con el controlador
router.post("/upload", imagesController_1.handleUploadImage);
router.post("/get", imagesController_1.handleGetImage);
exports.default = router;
//# sourceMappingURL=imageRoutes.js.map