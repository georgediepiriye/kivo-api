import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import { globalErrorHandler } from "./middleware/errorMiddleware.js";
import authRouter from "./routes/authRoutes.js";
import eventRouter from "./routes/eventRoutes.js";
import hotspotRouter from "./routes/hotspotRoutes.js";
import ticketRouter from "./routes/ticketRoutes.js";
import httpStatus from "http-status";
import AppError from "./utils/AppError.js";
import * as webhookController from "./controllers/webhookController.js";
import cookieParser from "cookie-parser";
import config from "./config/config.js";
import passport from "passport";
import "./config/passport.js";

const app = express();

/**
 * GLOBAL MIDDLEWARES
 */
app.use(helmet()); // Security headers
app.use(cookieParser()); // Parse cookies
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  }),
);

app.use(passport.initialize());

app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * 1. PAYSTACK WEBHOOK (BEFORE express.json)
 * We use express.raw so we can verify the signature accurately.
 */
app.post(
  "/v1/webhooks/paystack",
  express.raw({ type: "application/json" }),
  webhookController.handlePaystackWebhook,
);

app.use(express.json({ limit: "10kb" })); // Body parser

/**
 * ROUTES
 */
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Kivo API is up and running",
  });
});

app.use("/v1/auth", authRouter);
app.use("/v1/events", eventRouter);
app.use("/v1/hotspots", hotspotRouter);
app.use("/v1/tickets", ticketRouter);

/**
 * 404 HANDLER
 * Catches all routes that don't match the ones above
 */
app.use((_, __, next) => {
  next(new AppError(httpStatus.NOT_FOUND, "Not found"));
});

/**
 * GLOBAL ERROR MIDDLEWARE
 */
app.use(globalErrorHandler);

export default app;
