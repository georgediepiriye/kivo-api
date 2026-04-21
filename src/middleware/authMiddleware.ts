import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User.js";
import AppError from "../utils/AppError.js";
import httpStatus from "http-status";
import config from "../config/config.js";

interface JwtPayload {
  id: string;
  iat: number;
}

/**
 * PROTECT MIDDLEWARE
 * We cast the entire function as 'RequestHandler' to ensure it is compatible
 * with router.use() and router.post() regardless of internal 'req' typing.
 */
export const protect = (async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1. Get token from Cookies or Authorization Header
    let token: string | undefined;

    if (req.cookies && req.cookies.kivo_auth_token) {
      token = req.cookies.kivo_auth_token;
    } else if (req.headers.authorization?.startsWith("Bearer")) {
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

    // 3. Check if user still exists in DB
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError(
          "The user belonging to this token no longer exists.",
          httpStatus.UNAUTHORIZED,
        ),
      );
    }

    // 4. Grant Access
    // Use 'as any' to bypass the conflict with Express's global User type
    (req as any).user = currentUser as IUser;
    next();
  } catch (error) {
    return next(
      new AppError(
        "Invalid token or session expired. Please log in again.",
        httpStatus.UNAUTHORIZED,
      ),
    );
  }
}) as RequestHandler;

/**
 * ROLE AUTHORIZATION
 */
export const restrictTo = (...roles: string[]) => {
  return ((req: Request, res: Response, next: NextFunction) => {
    // Use 'as any' to access the user object we attached in 'protect'
    const user = (req as any).user as IUser | undefined;

    if (!user || !roles.includes(user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action",
          httpStatus.FORBIDDEN,
        ),
      );
    }
    next();
  }) as RequestHandler;
};
