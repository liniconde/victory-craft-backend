import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "default_secret";

// Obtener todos los usuarios
export const getUsers = async () => {
  return User.find();
};

// Obtener un usuario por ID
export const getUserById = async (id: string) => {
  return User.findById(id);
};

// Registrar un nuevo usuario
export const registerUser = async (userData: any) => {
  const { username, email, password, firstName, lastName } = userData;

  // Verificar si el usuario ya existe
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("Email already registered");
  }

  // Hashear la contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  // Crear el usuario
  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    firstName,
    lastName,
  });

  await newUser.save();

  // Generar token JWT
  const token = jwt.sign(
    { id: newUser._id, email: newUser.email },
    SECRET_KEY,
    {
      expiresIn: "7d",
    }
  );

  return { user: newUser, token };
};

// Iniciar sesión
export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  // Comparar la contraseña
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  // Generar token JWT
  const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, {
    expiresIn: "7d",
  });

  return { user, token };
};

// Actualizar usuario
export const updateUser = async (id: string, user: any) => {
  const updatedUser = await User.findByIdAndUpdate(id, user, {
    new: true,
  });
  return updatedUser;
};

// Eliminar usuario
export const deleteUser = async (id: string) => {
  return User.findByIdAndDelete(id);
};
