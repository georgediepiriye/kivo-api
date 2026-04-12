import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import { globalErrorHandler } from "./middleware/errorMiddleware";
import authRouter from "./routes/authRoutes";
import eventRouter from "./routes/eventRoutes";
import httpStatus from "http-status";
import AppError from "./utils/appError";

const app = express();

/**
 * GLOBAL MIDDLEWARES
 */
app.use(helmet()); // Security headers
app.use(cors()); // Cross-origin resource sharing
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
