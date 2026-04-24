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
import logger from "../../utils/logger.js"; // Import your winston logger

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

export const lockInventory = async (
  eventId: string,
  tierName: string,
  quantity: number,
  session?: ClientSession,
): Promise<number> => {
  // DEBUG LOG: Track inventory attempts
  logger.debug(
    `Inventory Lock Attempt: Event=${eventId} Tier=${tierName} Qty=${quantity}`,
  );

  const updatedEvent = await Event.findOneAndUpdate(
    {
      _id: eventId,
      "ticketTiers.name": tierName,
    },
    {
      $inc: {
        "ticketTiers.$[tier].sold": quantity,
        attendees: quantity,
      },
    },
    {
      arrayFilters: [{ "tier.name": tierName }],
      new: true,
      runValidators: true,
      session,
    },
  );

  if (!updatedEvent) {
    logger.error(
      `Inventory Lock Failed: Event ${eventId} or Tier ${tierName} not found`,
    );
    throw new Error(
      `Event not found or Ticket Tier "${tierName}" does not exist.`,
    );
  }

  const tier = updatedEvent.ticketTiers.find((t: any) => t.name === tierName);

  if (!tier) {
    throw new Error(
      "Internal integrity error: Ticket tier vanished during update.",
    );
  }

  // Capacity Check
  if (tier.sold > tier.capacity) {
    logger.warn(
      `Sold Out Triggered: Event=${eventId} Tier=${tierName} (Sold:${tier.sold} > Cap:${tier.capacity})`,
    );
    throw new Error(`Sold Out: ${tierName} has reached maximum capacity.`);
  }

  return tier.price;
};

export const processBooking = async (
  userId: string | null,
  userEmail: string,
  eventId: string,
  tierName: string,
  quantity: number = 1,
  buyerDetails: { firstName: string; lastName: string },
) => {
  const existingOrder = await getExistingPendingOrder(
    userEmail,
    eventId,
    tierName,
  );

  if (existingOrder) {
    logger.info(
      `Booking Idempotency: Resuming pending order ${existingOrder.paymentReference} for ${userEmail}`,
    );
    return {
      authorization_url: existingOrder.paymentUrl,
      reference: existingOrder.paymentReference,
    };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const unitPrice = await lockInventory(eventId, tierName, quantity, session);

    // Initialize Paystack
    const payment = await PaystackService.initializeTransaction({
      email: userEmail,
      amount: unitPrice * quantity * 100,
      callback_url: `${config.clientUrl}/verify-payment`,
      metadata: { userId, eventId, tierName, quantity, ...buyerDetails },
    });

    logger.info(
      `Paystack Initialized: Ref=${payment.data.reference} Amount=${unitPrice * quantity}`,
    );

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
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      ],
      { session },
    );

    await session.commitTransaction();
    logger.info(
      `Booking Transaction Committed: OrderID=${order._id} Ref=${order.paymentReference}`,
    );

    return {
      authorization_url: order.paymentUrl,
      reference: order.paymentReference,
    };
  } catch (error: any) {
    await session.abortTransaction();
    logger.error(
      `Booking Transaction Aborted: ${error.message} - User: ${userEmail}`,
    );
    throw error;
  } finally {
    await session.endSession();
  }
};

export const fulfillOrder = async (reference: string, metadata: any) => {
  logger.info(`Order Fulfillment Started: Ref=${reference}`);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findOne({ paymentReference: reference }).session(
      session,
    );

    if (!order) {
      logger.error(
        `Fulfillment Failed: Order with Reference ${reference} not found in DB`,
      );
      await session.endSession();
      return;
    }

    if (order.status === ORDER_STATUS.COMPLETED) {
      logger.warn(`Fulfillment Skip: Order ${reference} already completed`);
      await session.endSession();
      return;
    }

    order.status = ORDER_STATUS.COMPLETED;
    await order.save({ session });

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

    await session.commitTransaction();
    logger.info(
      `Order Fulfilled Successfully: Ref=${reference}. ${ticketsToCreate.length} tickets generated.`,
    );
  } catch (error: any) {
    await session.abortTransaction();
    logger.error(
      `Order Fulfillment CRITICAL FAILURE: Ref=${reference} - ${error.message}`,
    );
    throw error;
  } finally {
    await session.endSession();
  }
};
