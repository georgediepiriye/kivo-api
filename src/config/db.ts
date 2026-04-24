import mongoose from "mongoose";
import config from "./config.js";
import logger from "../utils/logger.js"; // Use the Winston logger we set up

export const connectDB = async () => {
  try {
    const dbUrl = config.db.url as string;

    if (!dbUrl) {
      logger.error("MongoDB Connection String is missing in config.");
      process.exit(1);
    }

    const conn = await mongoose.connect(dbUrl);

    logger.info(`📡 MongoDB Connected: ${conn.connection.host}`);

    // 2. Monitor Connection Events
    // Essential for detecting "Silent Failures" where the app stays up but the DB is gone
    mongoose.connection.on("error", (err) => {
      logger.error(`MongoDB Runtime Error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB Disconnected. Attempting to reconnect...");
    });

    // 3. Graceful Shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error: any) {
    logger.error(`🚨 MongoDB Connection Failure: ${error.message}`);

    // In production, if you can't connect to the DB, the app is useless.
    // Exit the process so your orchestrator (Render/PM2/Docker) can restart it.
    process.exit(1);
  }
};
