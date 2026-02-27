import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Nombre de usuario único
  email: { type: String, required: true, unique: true }, // Correo electrónico único
  googleSub: { type: String, unique: true, sparse: true }, // Subject de Google OAuth
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

export default mongoose.model("User", UserSchema);
