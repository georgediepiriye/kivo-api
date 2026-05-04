import cron from "node-cron";
import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Event } from "../models/Event.js";
import { ORDER_STATUS } from "../lib/constants.js";
import logger from "../utils/logger.js";

export const initInventoryCron = () => {
  // Runs every 5 minutes
  // Minute | Hour | DayOfMonth | Month | DayOfWeek
  cron.schedule("*/5 * * * *", async () => {
    logger.info("CRON: Checking for expired pending orders...");

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // 1. Find orders that are PENDING and have passed their expiry time
      // We process them in batches of 50 to keep it very light on the server
      const expiredOrders = await Order.find({
        status: ORDER_STATUS.PENDING,
        expiresAt: { $lt: new Date() },
      })
        .limit(50)
        .session(session);

      if (expiredOrders.length === 0) {
        await session.abortTransaction();
        return;
      }

      logger.info(
        `CRON: Releasing inventory for ${expiredOrders.length} orders.`,
      );

      for (const order of expiredOrders) {
        // 2. Give the inventory back to the Event
        await Event.updateOne(
          {
            _id: order.event,
            "ticketTiers.name": order.tierName,
          },
          {
            $inc: {
              "ticketTiers.$[tier].sold": -order.quantity,
              attendees: -order.quantity,
            },
          },
          {
            arrayFilters: [{ "tier.name": order.tierName }],
            session,
          },
        );

        // 3. Mark as expired so it's never picked up again
        order.status = "expired";
        await order.save({ session });
      }

      await session.commitTransaction();
      logger.info("CRON: Inventory cleanup completed successfully.");
    } catch (error: any) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      logger.error(`CRON ERROR: ${error.message}`);
    } finally {
      await session.endSession();
    }
  });
};
