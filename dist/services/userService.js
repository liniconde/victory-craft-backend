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
exports.deleteUser = exports.updateUser = exports.loginUser = exports.registerUser = exports.getUserById = exports.getUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET_KEY = process.env.SECRET_KEY || "default_secret";
// Obtener todos los usuarios
const getUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    return User_1.default.find();
});
exports.getUsers = getUsers;
// Obtener un usuario por ID
const getUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return User_1.default.findById(id);
});
exports.getUserById = getUserById;
// Registrar un nuevo usuario
const registerUser = (userData) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password, firstName, lastName } = userData;
    // Verificar si el usuario ya existe
    const existingUser = yield User_1.default.findOne({ email });
    if (existingUser) {
        throw new Error("Email already registered");
    }
    // Hashear la contraseña
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    // Crear el usuario
    const newUser = new User_1.default({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
    });
    yield newUser.save();
    // Generar token JWT
    const token = jsonwebtoken_1.default.sign({ id: newUser._id, email: newUser.email }, SECRET_KEY, {
        expiresIn: "7d",
    });
    return { user: newUser, token };
});
exports.registerUser = registerUser;
// Iniciar sesión
const loginUser = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_1.default.findOne({ email });
    if (!user) {
        throw new Error("User not found");
    }
    // Comparar la contraseña
    const isMatch = yield bcrypt_1.default.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Invalid credentials");
    }
    // Generar token JWT
    const token = jsonwebtoken_1.default.sign({ id: user._id, email: user.email }, SECRET_KEY, {
        expiresIn: "7d",
    });
    return { user, token };
});
exports.loginUser = loginUser;
// Actualizar usuario
const updateUser = (id, user) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedUser = yield User_1.default.findByIdAndUpdate(id, user, {
        new: true,
    });
    return updatedUser;
});
exports.updateUser = updateUser;
// Eliminar usuario
const deleteUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return User_1.default.findByIdAndDelete(id);
});
exports.deleteUser = deleteUser;
//# sourceMappingURL=userService.js.map