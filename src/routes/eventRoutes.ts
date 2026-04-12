import { Router } from "express";
import * as eventController from "../controllers/eventController";
import { protect, restrictTo } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import { createEventSchema } from "../validation/eventValidation";

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
