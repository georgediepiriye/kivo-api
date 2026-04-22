import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import { Ticket } from "../models/Ticket.js";
import AppError from "../utils/AppError.js";
import * as ticketService from "./services/ticketService.js";
import { BookTicketInput } from "../validation/ticketValidation.js";
import { PaystackService } from "../utils/paystackServices.js";
import { Order } from "../models/Order.js";

/**
 * @desc    Initialize a ticket booking
 * @route   POST /v1/tickets/book
 * @access  Public
 */
export const initializeBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { eventId, tierName, quantity, email, firstName, lastName } =
      req.body;
    const userId = (req.user as any)?.id?.toString() || null;

    const result = await ticketService.processBooking(
      userId,
      email,
      eventId,
      tierName,
      quantity,
      { firstName, lastName },
    );

    res.status(httpStatus.OK).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyTicketPayment = async (req: Request, res: Response) => {
  const { reference } = req.params;

  const order = await Order.findOne({ paymentReference: reference })
    .populate("event")
    .populate("user");

  if (!order) {
    return res
      .status(404)
      .json({ status: "error", message: "Transaction not found" });
  }

  if (order.status === "completed") {
    // If completed, fetch the tickets created for this order
    const tickets = await Ticket.find({ order: order._id });

    return res.status(200).json({
      status: "success",
      message: "Payment confirmed!",
      data: {
        order,
        tickets,
      },
    });
  }
  res.status(200).json({
    status: "pending",
    message: "We are finalizing your tickets...",
  });
};

/**
 * @desc    Get all tickets belonging to the logged-in user
 * @route   GET /api/v1/tickets/my-tickets
 * @access  Protected
 */
// export const getMyTickets = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const tickets = await Ticket.find({ owner: req.user.id })
//       .populate({
//         path: "event",
//         select: "title startDate location image eventFormat",
//       })
//       .sort("-createdAt");

//     res.status(httpStatus.OK).json({
//       status: "success",
//       results: tickets.length,
//       data: { tickets },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

/**
 * @desc    Get details for a single ticket (includes QR data)
 * @route   GET /api/v1/tickets/:id
 * @access  Protected
 */
// export const getTicketDetails = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const ticket = await Ticket.findOne({
//       _id: req.params.id,
//       owner: req.user.id,
//     }).populate("event");

//     if (!ticket) {
//       return next(
//         new AppError(httpStatus.NOT_FOUND, "Ticket not found or access denied"),
//       );
//     }

//     res.status(httpStatus.OK).json({
//       status: "success",
//       data: { ticket },
//     });
//   } catch (error) {
//     next(error);
//   }
// };
