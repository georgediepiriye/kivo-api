import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import { globalErrorHandler } from "./middleware/errorMiddleware.js";
import authRouter from "./routes/authRoutes.js";
import eventRouter from "./routes/eventRoutes.js";
import hotspotRouter from "./routes/hotspotRoutes.js";
import ticketRouter from "./routes/ticketRoutes.js";
import userRouter from "./routes/userRoutes.js";
import httpStatus from "http-status";
import AppError from "./utils/AppError.js";
import * as webhookController from "./controllers/webhookController.js";
import cookieParser from "cookie-parser";
import config from "./config/config.js";
import passport from "passport";
import "./config/passport.js";

const app = express();

/**
 * PRODUCTION TRUST PROXY
 * Required for Render to handle 'secure' cookies and 'https' headers correctly.
 */
app.enable("trust proxy");

/**
 * GLOBAL MIDDLEWARES
 */
app.use(helmet());
app.use(cookieParser());

/**
 * CORS CONFIGURATION
 * 1. origin: Must match your frontend URL exactly (NO trailing slash).
 * 2. credentials: true is required for HttpOnly cookies to work.
 */
const corsOptions = {
  origin: config.clientUrl,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

/**
 * PREFLIGHT HANDLING
 * Using a Regex (/^\/.*$/) to match all paths.
 * This avoids the 'path-to-regexp' PathError in modern Express versions.
 */
app.options(/^\/.*$/, cors(corsOptions));

app.use(passport.initialize());

/**
 * 1. PAYSTACK WEBHOOK (STRICTLY BEFORE express.json)
 */
app.post(
  "/v1/webhooks/paystack",
  express.raw({ type: "application/json" }),
  webhookController.handlePaystackWebhook,
);

/**
 * 2. BODY PARSERS
 */
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

/**
 * LOGGING (Development only)
 */
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
    next();
  });
}

/**
 * API ROUTES
 */
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Kivo API is up and running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/v1/auth", authRouter);
app.use("/v1/events", eventRouter);
app.use("/v1/hotspots", hotspotRouter);
app.use("/v1/tickets", ticketRouter);
app.use("/v1/users", userRouter);

/**
 * 404 HANDLER
 * Using Regex to catch all undefined routes without crashing the parser.
 */
app.all(/^\/.*$/, (_, __, next) => {
  next(
    new AppError(httpStatus.NOT_FOUND, "The requested resource was not found."),
  );
});

/**
 * GLOBAL ERROR MIDDLEWARE
 */
app.use(globalErrorHandler);

export default app;
