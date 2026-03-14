import express from "express";
import { requireAuth } from "../middlewares/authMiddleware";
import { handleEnqueueWorkersStart } from "../controllers/workersControlController";

const router = express.Router();

router.post("/start", requireAuth, handleEnqueueWorkersStart);

export default router;
