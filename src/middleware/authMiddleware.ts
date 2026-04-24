import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User.js";
import AppError from "../utils/AppError.js";
import httpStatus from "http-status";
import config from "../config/config.js";
import logger from "../utils/logger.js";

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

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      logger.debug(
        `Protect Middleware: No token provided for ${req.originalUrl}`,
      );
      return next(
        new AppError(
          httpStatus.UNAUTHORIZED,
          "You are not logged in. Please log in to get access.",
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
      logger.warn(
        `Auth Failure: Valid token but User ${decoded.id} no longer exists.`,
      );
      return next(
        new AppError(
          httpStatus.UNAUTHORIZED,
          "The user belonging to this token no longer exists.",
        ),
      );
    }

    // 4. Grant Access
    // Use 'as any' to bypass the conflict with Express's global User type
    (req as any).user = currentUser as IUser;
    next();
  } catch (error: any) {
    logger.warn(`JWT Verification Failed: ${error.message} from IP: ${req.ip}`);
    return next(
      new AppError(
        httpStatus.UNAUTHORIZED,
        "Invalid token or session expired. Please log in again.",
      ),
    );
  }
}) as RequestHandler;

/**
 * OPTIONAL PROTECT MIDDLEWARE
 * Tries to identify the user but doesn't block the request if they are a guest.
 */
export const optionalProtect = (async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let token: string | undefined;

    // Look for the cookie we identified earlier: "token"
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // If no token, just move to the controller as a guest
    if (!token) {
      return next();
    }

    // If there is a token, try to verify it
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    const currentUser = await User.findById(decoded.id);

    if (currentUser) {
      (req as any).user = currentUser;
    }

    next();
  } catch (error: any) {
    // If token is invalid, we still allow them to proceed as a guest
    next();
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
      logger.warn(
        `Forbidden Access Attempt: User ${user?._id || "Anonymous"} tried to access ${req.originalUrl} - Required Roles: [${roles}]`,
      );
      return next(
        new AppError(
          httpStatus.FORBIDDEN,
          "You do not have permission to perform this action",
        ),
      );
    }
    next();
  }) as RequestHandler;
};
