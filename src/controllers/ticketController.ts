import { Request, Response } from "express";
import { Ticket } from "../models/Ticket.js";
import httpStatus from "http-status";

export const verifyTicket = async (req: Request, res: Response) => {
  const { qrCodeData } = req.body; // The string extracted from the QR scan

  // 1. Find the ticket and populate event details
  const ticket = await Ticket.findOne({ qrCodeData }).populate("event");

  if (!ticket) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: "Invalid Ticket: Not found in Kivo database.",
    });
  }

  // 2. Check if the ticket is for the right event (optional but pro)
  // if (ticket.event._id.toString() !== req.body.eventId) { ... }

  // 3. Security: Check if already used
  if (ticket.status === "used") {
    return res.status(httpStatus.CONFLICT).json({
      success: false,
      message: `Already Checked In at ${ticket.checkedInAt?.toLocaleTimeString()}`,
      attendee: ticket.ownerName, // if you store this
    });
  }

  // 4. Update status to 'used'
  ticket.status = "used";
  ticket.checkedInAt = new Date();
  await ticket.save();

  return res.status(httpStatus.OK).json({
    success: true,
    message: "Access Granted",
    tier: ticket.tierName,
    owner: ticket.ownerName,
  });
};
