import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { Server } from "http";

let server: Server;

/**
 * BOOTSTRAP FUNCTION
 */
const bootstrap = async () => {
  try {
    console.log("⏳ Initializing Kivo API startup...");

    // 1. Wait for Database
    await connectDB();

    // 2. Start Server only if DB is successful
    server = app.listen(env.PORT, () => {
      console.log(
        `🚀 Kivo API running on port ${env.PORT} in ${env.NODE_ENV} mode`,
      );
    });
  } catch (err) {
    // LOG THE ERROR TO CONSOLE
    console.error("❌ STARTUP ERROR:");
    console.error(err);

    // Kill the process so it doesn't stay in a "zombie" state
    process.exit(1);
  }
};

bootstrap();

/**
 * GLOBAL PROCESS HANDLERS
 */
process.on("unhandledRejection", (err: Error) => {
  console.error("💥 UNHANDLED REJECTION! Shutting down...");
  console.error(err); // Log the full error stack

  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});
