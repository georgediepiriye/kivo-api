import mongoose from "mongoose";
import config from "./config.js";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.db.url as string);
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Log precisely what went wrong with the DB
    console.error("🚨 MongoDB Connection Failure Details:");
    console.error(error);

    // RE-THROW the error so server.ts can catch it and kill the process
    throw error;
  }
};
