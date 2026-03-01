import express from "express";
import {
  handleDeleteNotification,
  handleListNotifications,
} from "../controllers/notificationController";

const router = express.Router();

router.get("/", handleListNotifications);
router.delete("/:id", handleDeleteNotification);

export default router;
