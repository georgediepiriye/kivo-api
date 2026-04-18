import { Router } from "express";
import * as hotspotController from "../controllers/hotspotController.js";

const router = Router();

// Public Routes
router.get("/", hotspotController.getAllHotspots);

// Protected Routes

export default router;
