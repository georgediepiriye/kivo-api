import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User.js";
import AppError from "../utils/AppError.js";
import httpStatus from "http-status";
import config from "../config/config.js";

// Extend the Express Request type to include the user object
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface JwtPayload {
  id: string;
  iat: number;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1. Get token and check if it exists
    let token: string | undefined;
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError(
          "You are not logged in. Please log in to get access.",
          httpStatus.UNAUTHORIZED,
        ),
      );
    }

    // 2. Verify token
    const decoded = jwt.verify(
      token,
      config.jwt.secret,
    ) as unknown as JwtPayload;

    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError(
          "The user belonging to this token no longer exists.",
          httpStatus.UNAUTHORIZED,
        ),
      );
    }

    // 4. Check if user changed password after token was issued (Optional but professional)
    // We can add a 'passwordChangedAt' field to the model later for this.

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (error) {
    return next(
      new AppError(
        "Invalid token. Please log in again.",
        httpStatus.UNAUTHORIZED,
      ),
    );
  }
};

/**
 * ROLE AUTHORIZATION
 * Limits access to specific roles (e.g., only 'organizer' can create events)
 */
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action",
          httpStatus.FORBIDDEN,
        ),
      );
    }
    next();
  };
};
