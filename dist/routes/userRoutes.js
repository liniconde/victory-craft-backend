"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const router = express_1.default.Router();
// Definir rutas y conectarlas con el controlador
router.get("/", userController_1.handleGetUsers);
router.get("/:id", userController_1.handleGetUserById);
router.put("/:id", userController_1.handleUpdateUser);
router.delete("/:id", userController_1.handleDeleteUser);
router.post("/register", userController_1.handleRegisterUser);
router.post("/login", userController_1.handleLoginUser);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map