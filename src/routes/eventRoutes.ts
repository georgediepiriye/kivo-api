import { Router } from "express";
import * as eventController from "../controllers/eventController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { createEventSchema } from "../validation/eventValidation.js";

const router = Router();

// Public Routes
router.get("/", eventController.getAllEvents);
router.get("/nearby", eventController.getNearbyEvents);
router.get("/:id", eventController.getEvent);

// Protected Routes
router.post(
  "/",
  protect,
  validate(createEventSchema),
  eventController.createEvent,
);

export default router;
