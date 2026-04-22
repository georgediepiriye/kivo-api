import mongoose, { ClientSession } from "mongoose";
import httpStatus from "http-status";
import { Order } from "../../models/Order.js";
import { ORDER_STATUS } from "../../lib/constants.js";
import { Event } from "../../models/Event.js";
import AppError from "../../utils/AppError.js";
import { PaystackService } from "../../utils/paystackServices.js";
import config from "../../config/config.js";
import { Ticket } from "../../models/Ticket.js";
import { nanoid } from "nanoid";

/**
 * Checks for a live, pending order to prevent accidental double-billing.
 */
const getExistingPendingOrder = async (
  email: string,
  eventId: string,
  tierName: string,
) => {
  return await Order.findOne({
    buyerEmail: email.toLowerCase(),
    event: eventId,
    tierName,
    status: ORDER_STATUS.PENDING,
    expiresAt: { $gt: new Date() },
  });
};

/**
 * Atomic Inventory Lock for Kivo
 * Increments sold count within a transaction session using MongoDB Array Filters.
 * * @param eventId - The ID of the event
 * @param tierName - The name of the ticket tier (e.g., "Backstage Access")
 * @param quantity - Number of tickets being requested
 * @param session - The Mongoose ClientSession for transaction atomicity
 * @returns The unit price (number) of the ticket tier
 */
export const lockInventory = async (
  eventId: string,
  tierName: string,
  quantity: number,
  session?: ClientSession,
): Promise<number> => {
  const updatedEvent = await Event.findOneAndUpdate(
    {
      _id: eventId,
      "ticketTiers.name": tierName, // Ensure the event has this specific tier
    },
    {
      $inc: {
        // The $[tier] refers to the element matched in arrayFilters below
        "ticketTiers.$[tier].sold": quantity,
        attendees: quantity,
      },
    },
    {
      // Crucial: Maps the identifier 'tier' to the array element with the matching name
      arrayFilters: [{ "tier.name": tierName }],
      new: true, // Return the document AFTER the increment
      runValidators: true,
      session, // Integrates with the transaction from processBooking
    },
  );

  // If no document matched, the event ID is wrong or the tier name doesn't exist
  if (!updatedEvent) {
    throw new Error(
      `Event not found or Ticket Tier "${tierName}" does not exist.`,
    );
  }

  // Extract the specific tier from the updated event to check its new 'sold' count
  const tier = updatedEvent.ticketTiers.find((t: any) => t.name === tierName);

  if (!tier) {
    throw new Error(
      "Internal integrity error: Ticket tier vanished during update.",
    );
  }

  // Capacity Check
  if (tier.sold > tier.capacity) {
    /* Because this is running inside a Mongoose Transaction (session),
       throwing this error triggers the .abortTransaction() in your controller.
       This automatically reverts the $inc operations above.
    */
    throw new Error(`Sold Out: ${tierName} has reached maximum capacity.`);
  }

  // Return the price so processBooking can calculate (unitPrice * quantity)
  return tier.price;
};
/**
 * Orchestrates the booking process.
 */
export const processBooking = async (
  userId: string | null,
  userEmail: string,
  eventId: string,
  tierName: string,
  quantity: number = 1,
  buyerDetails: { firstName: string; lastName: string },
) => {
  // 1. IDEMPOTENCY CHECK (Prevents duplicate pending sessions)
  const existingOrder = await getExistingPendingOrder(
    userEmail,
    eventId,
    tierName,
  );
  if (existingOrder) {
    return {
      authorization_url: existingOrder.paymentUrl,
      reference: existingOrder.paymentReference,
    };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 2. LOCK INVENTORY (Atomic)
    const unitPrice = await lockInventory(eventId, tierName, quantity, session);

    // 3. INITIALIZE PAYMENT (External API)
    const payment = await PaystackService.initializeTransaction({
      email: userEmail,
      amount: unitPrice * quantity * 100, // Naira to Kobo
      callback_url: `${config.clientUrl}/verify-payment`,
      metadata: {
        userId,
        eventId,
        tierName,
        quantity,
        ...buyerDetails,
      },
    });
    // 4. CREATE ORDER RECORD
    const [order] = await Order.create(
      [
        {
          user: userId || undefined,
          buyerEmail: userEmail.toLowerCase(),
          event: new mongoose.Types.ObjectId(eventId),
          tierName,
          quantity,
          totalAmount: unitPrice * quantity,
          paymentReference: payment.data.reference,
          paymentUrl: payment.data.authorization_url,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15-minute window
        },
      ],
      { session },
    );

    // 5. COMMIT TRANSACTION
    await session.commitTransaction();

    return {
      authorization_url: order.paymentUrl,
      reference: order.paymentReference,
    };
  } catch (error) {
    // 6. AUTO-ROLLBACK (Undoes inventory lock if Paystack or Order creation fails)
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const fulfillOrder = async (reference: string, metadata: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Check if the order is already processed (Idempotency)
    const order = await Order.findOne({ paymentReference: reference }).session(
      session,
    );

    if (!order || order.status === ORDER_STATUS.COMPLETED) {
      await session.endSession();
      return; // Already done or doesn't exist
    }

    // 2. Mark Order as Completed
    order.status = ORDER_STATUS.COMPLETED;
    await order.save({ session });

    // 3. Generate the Ticket(s)
    // If quantity is 5, we create 5 separate ticket documents
    const ticketsToCreate = [];
    for (let i = 0; i < order.quantity; i++) {
      const ticketCode = `KIVO-${nanoid(8).toUpperCase()}`;

      ticketsToCreate.push({
        event: order.event,
        owner: order.user,
        order: order._id,
        tierName: order.tierName,
        pricePaid: order.totalAmount / order.quantity,
        buyerInfo: {
          firstName: metadata.firstName,
          lastName: metadata.lastName,
          email: order.buyerEmail,
        },
        ticketCode,
        qrCodeData: JSON.stringify({ code: ticketCode, eventId: order.event }),
        status: "valid",
      });
    }

    await Ticket.insertMany(ticketsToCreate, { session });

    // 4. Commit everything
    await session.commitTransaction();

    // 5. TODO: Trigger Email Service (SendGrid/Mailgun) to send QR codes to user
    // sendTicketEmail(order.buyerEmail, ticketsToCreate);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
