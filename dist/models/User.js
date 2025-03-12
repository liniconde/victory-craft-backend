"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const UserSchema = new mongoose_1.default.Schema({
    username: { type: String, required: true, unique: true }, // Nombre de usuario único
    email: { type: String, required: true, unique: true }, // Correo electrónico único
    password: { type: String, required: true }, // Contraseña hasheada
    firstName: { type: String, required: true }, // Nombre
    lastName: { type: String, required: true }, // Apellido
    profileImage: { type: String }, // URL de la imagen de perfil
    role: { type: String, enum: ["user", "admin"], default: "user" }, // Rol del usuario
    createdAt: { type: Date, default: Date.now }, // Fecha de creación
    updatedAt: { type: Date, default: Date.now }, // Fecha de actualización
});
// Middleware para actualizar el `updatedAt` antes de guardar cambios
UserSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});
exports.default = mongoose_1.default.model("User", UserSchema);
//# sourceMappingURL=User.js.map