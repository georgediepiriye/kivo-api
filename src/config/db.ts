import mongoose from "mongoose";
import { env } from "./env";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Log precisely what went wrong with the DB
    console.error("🚨 MongoDB Connection Failure Details:");
    console.error(error);

    // RE-THROW the error so server.ts can catch it and kill the process
    throw error;
  }
};
