import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import httpStatus from "http-status";
import AppError from "../utils/appError";

export const validate =
  (schema: z.ZodObject<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        // Humanize the Zod message immediately
        const errorMessage = error.issues
          .map((issue) => {
            // Get the field name (e.g., "email") and ignore the parent ("body")
            const field = issue.path.length > 1 ? issue.path[1] : issue.path[0];
            const readableField =
              String(field).charAt(0).toUpperCase() + String(field).slice(1);

            // Clean common technical messages
            let customMessage = issue.message;
            if (customMessage === "Required") customMessage = "is required";
            if (customMessage.includes("expected string"))
              customMessage = "is required";

            return `${readableField} ${customMessage}`;
          })
          .join(". ");

        return next(new AppError(httpStatus.BAD_REQUEST, errorMessage));
      }

      return next(error);
    }
  };
