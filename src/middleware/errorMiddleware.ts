// src/middleware/errorMiddleware.ts
import { Request, Response, NextFunction } from "express";
import config from "../config/config.js";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 1. INITIALIZE DEFAULTS
  let statusCode = err.statusCode || 500;
  let status = err.status || "error";
  let message = err.message;

  // 2. MANDATORY SERVER LOGGING (Terminal)
  console.error("\x1b[31m%s\x1b[0m", "------- ERROR LOG -------");
  console.error(`Method: ${req.method} | URL: ${req.originalUrl}`);
  console.error(`Status: ${statusCode}`);
  console.error(`Message: ${message}`);

  if (config.env === "development") {
    console.error("Stack Trace:", err.stack);
  }
  console.error("\x1b[31m%s\x1b[0m", "-------------------------");

  // 3. SPECIALIZED ERROR HANDLING (Humanizing technical messages)

  // Handle Mongoose Duplicate Key (e.g., Email already exists)
  if (err.code === 11000) {
    statusCode = 400;
    status = "fail";
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already in use.`;
  }

  // Handle Mongoose Validation Errors (e.g., required fields, length)
  if (err.name === "ValidationError") {
    statusCode = 400;
    status = "fail";
    message = Object.values(err.errors)
      .map((el: any) => {
        let msg = el.message;
        // Strip out technical pathing like "body.", "path", or "User validation failed"
        msg = msg.replace(/User validation failed: /g, "");
        msg = msg.replace(/body\./g, "");
        msg = msg.replace(/path /g, "");
        // Capitalize for professional look
        return msg.charAt(0).toUpperCase() + msg.slice(1);
      })
      .join(". ");
  }

  // Handle Zod or other Schema Validation (if you use them)
  if (err.name === "ZodError") {
    statusCode = 400;
    status = "fail";
    message = err.issues
      .map((issue: any) => {
        const field = issue.path[issue.path.length - 1];
        return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      })
      .join(". ");
  }

  // 4. SEND RESPONSE TO CLIENT
  if (config.env === "development") {
    return res.status(statusCode).json({
      status,
      message,
      stack: err.stack,
      error: err,
    });
  }

  // PRODUCTION: Send clean messages for operational errors
  if (err.isOperational || statusCode < 500) {
    return res.status(statusCode).json({
      status,
      message,
    });
  }

  // PRODUCTION: Fallback for unexpected bugs (leak no details)
  return res.status(500).json({
    status: "error",
    message: "Something went very wrong on our end!",
  });
};
