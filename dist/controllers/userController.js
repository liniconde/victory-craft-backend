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
exports.handleDeleteUser = exports.handleUpdateUser = exports.handleLoginUser = exports.handleRegisterUser = exports.handleGetUserById = exports.handleGetUsers = void 0;
const userService_1 = require("../services/userService");
// Obtener todos los usuarios
const handleGetUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield (0, userService_1.getUsers)();
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.handleGetUsers = handleGetUsers;
// Obtener un usuario por ID
const handleGetUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield (0, userService_1.getUserById)(req.params.id);
        if (!user) {
            res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.handleGetUserById = handleGetUserById;
// Registrar un nuevo usuario
const handleRegisterUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user, token } = yield (0, userService_1.registerUser)(req.body);
        res.status(201).json({ user, token });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});
exports.handleRegisterUser = handleRegisterUser;
// Iniciar sesión
const handleLoginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required" });
        }
        const { user, token } = yield (0, userService_1.loginUser)(email, password);
        res.json({ user, token });
    }
    catch (err) {
        res.status(401).json({ message: err.message });
    }
});
exports.handleLoginUser = handleLoginUser;
// Actualizar un usuario
const handleUpdateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedUser = yield (0, userService_1.updateUser)(req.params.id, req.body);
        if (!updatedUser) {
            res.status(404).json({ message: "User not found" });
        }
        res.json(updatedUser);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});
exports.handleUpdateUser = handleUpdateUser;
// Eliminar un usuario
const handleDeleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedUser = yield (0, userService_1.deleteUser)(req.params.id);
        if (!deletedUser) {
            res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User deleted" });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.handleDeleteUser = handleDeleteUser;
//# sourceMappingURL=userController.js.map