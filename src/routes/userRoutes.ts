import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import * as userController from "../controllers/userController.js";

const router = Router();

// Only logged-in users can hit this
router.get("/profile", protect, userController.getProfile);

export default router;
