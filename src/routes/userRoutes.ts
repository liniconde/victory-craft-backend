import express from "express";
import {
  handleGetUsers,
  handleGetUserById,
  handleUpdateUser,
  handleDeleteUser,
  handleRegisterUser,
  handleLoginUser,
} from "../controllers/userController";
import {
  startGoogleOAuthController,
  googleOAuthCallbackController,
} from "../controllers/oauthController";

const router = express.Router();

// Definir rutas y conectarlas con el controlador
router.get("/oauth2/google", startGoogleOAuthController);
router.get("/oauth2/google/callback", googleOAuthCallbackController);
router.get("/", handleGetUsers);
router.get("/:id", handleGetUserById);
router.put("/:id", handleUpdateUser);
router.delete("/:id", handleDeleteUser);
router.post("/register", handleRegisterUser);
router.post("/login", handleLoginUser);

export default router;
