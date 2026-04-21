import { Router } from "express";
import * as eventController from "../controllers/eventController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { createEventSchema } from "../validation/eventValidation.js";

const router = Router();

// --- PUBLIC ROUTES ---
router.get("/", eventController.getAllEvents);
router.get("/nearby", eventController.getNearbyEvents);
router.get("/:id", eventController.getEvent);

// --- PROTECTED ROUTES GATE ---
// Everything below this line now requires a valid login cookie
router.use(protect);

router.post(
  "/",
  restrictTo("organizer", "admin"), // Only organizers can create
  validate(createEventSchema),
  eventController.createEvent,
);

// router.patch("/:id", eventController.updateEvent);
// router.delete("/:id", eventController.deleteEvent);

export default router;
