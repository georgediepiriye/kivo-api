import { Router } from "express";
import * as ticketController from "../controllers/ticketController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { bookTicketSchema } from "../validation/ticketValidation.js";

const router = Router();

//Initialize Booking (Starts the booking flow)
router.post(
  "/book",
  validate(bookTicketSchema),
  ticketController.initializeBooking,
);

router.get("/verify/:reference", ticketController.verifyTicketPayment);

// 3. User's Ticket Collection
// router.get("/my-tickets", protect, ticketController.getMyTickets);

// // 4. Specific Ticket Details (For showing QR code)
// router.get("/:id", protect, ticketController.getTicketDetails);

export default router;
