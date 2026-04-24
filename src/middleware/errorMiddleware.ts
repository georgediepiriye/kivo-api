import { Request, Response, NextFunction } from "express";
import config from "../config/config.js";
import logger from "../utils/logger.js"; // Import your winston logger

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = err.statusCode || 500;
  let status = err.status || "error";
  let message = err.message;

  // 1. LOG THE ERROR (The Winston Way)
  // We log before we start "humanizing" the message so we have the raw technical data.
  if (statusCode >= 500) {
    // This is a server crash/bug - Use 'error' level
    logger.error(
      `SYSTEM ERROR: [${req.method}] ${req.originalUrl} | Status: ${statusCode} | Message: ${message} | Stack: ${err.stack}`,
    );
  } else {
    // This is a user/client error (400s) - Use 'warn' level
    logger.warn(
      `OPERATIONAL ERROR: [${req.method}] ${req.originalUrl} | Status: ${statusCode} | Message: ${message}`,
    );
  }

  // 2. SPECIALIZED ERROR HANDLING (Same as your current logic)

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    statusCode = 400;
    status = "fail";
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already in use.`;
  }

  // Mongoose Validation
  if (err.name === "ValidationError") {
    statusCode = 400;
    status = "fail";
    message = Object.values(err.errors)
      .map(
        (el: any) =>
          el.message
            .replace(/body\./g, "")
            .charAt(0)
            .toUpperCase() + el.message.slice(1),
      )
      .join(". ");
  }

  // 3. SEND RESPONSE
  if (config.env === "development") {
    return res.status(statusCode).json({
      status,
      message,
      stack: err.stack,
      error: err,
    });
  }

  // PRODUCTION: Handle Operational vs Unexpected
  if (err.isOperational || statusCode < 500) {
    return res.status(statusCode).json({ status, message });
  }

  // Final fallback
  return res.status(500).json({
    status: "error",
    message: "Something went very wrong on our end!",
  });
};
