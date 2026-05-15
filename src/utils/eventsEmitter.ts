import { EventEmitter } from "events";
import logger from "./logger.js";
import { sendTicketEmail, sendRefundEmail } from "./emailService.js"; // Assume sendRefundEmail exists

// Initialize the EventEmitter
const kivoEvents = new EventEmitter();

/**
 * Handle Order Fulfillment (Success)
 */
const handleOrderFulfilled = async ({
  order,
  tickets,
  eventImage,
}: {
  order: any;
  tickets: any[];
  eventImage: string;
}) => {
  try {
    logger.info(`Background: Sending tickets for Order ${order._id}`);
    await sendTicketEmail(order.buyerEmail, tickets, eventImage);
    logger.info(`Background: Email sent successfully to ${order.buyerEmail}`);
  } catch (error: any) {
    logger.error(`Background Error: Failed to send email: ${error.message}`);
  }
};

/**
 * Handle Ticket Refund (Cancellation)
 */
const handleTicketRefunded = async ({
  ticket,
  order,
}: {
  ticket: any;
  order: any;
}) => {
  try {
    logger.info(
      `Background: Processing refund notification for Ticket ${ticket.ticketCode}`,
    );

    // Call your email service to inform the user about the refund
    // In a no-wallet setup, it's vital to mention the 3-5 day bank processing time
    await sendRefundEmail(order.buyerEmail, ticket);

    logger.info(`Background: Refund notification sent to ${order.buyerEmail}`);
  } catch (error: any) {
    logger.error(
      `Background Error: Failed to send refund email: ${error.message}`,
    );
  }
};

/**
 * PREVENT MEMORY LEAKS
 * removeAllListeners ensures we don't duplicate listeners during hot-reloads
 */
kivoEvents.removeAllListeners("order.fulfilled");
kivoEvents.removeAllListeners("ticket.refunded");

// Register the listeners
kivoEvents.on("order.fulfilled", handleOrderFulfilled);
kivoEvents.on("ticket.refunded", handleTicketRefunded);

kivoEvents.setMaxListeners(20);

export default kivoEvents;
