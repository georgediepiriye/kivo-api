import { Request, Response, NextFunction } from "express";
import * as authService from "./services/authService.js";
import { signToken } from "../utils/jwt.js";
import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import config from "../config/config.js";
import jwt from "jsonwebtoken";

export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const newUser = await authService.createUser(req.body);
    const token = signToken(newUser._id.toString(), newUser.role);

    const user = newUser.toObject();
    delete user.password;
    delete user.__v;

    // Retain for fallback, but we will no longer rely on it exclusively in prod
    res.cookie("token", token, {
      httpOnly: true,
      secure: config.env === "production",
      sameSite: config.env === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(httpStatus.CREATED).json({
      status: "success",
      token, // 💡 CRITICAL: Ensure token is passed explicitly in response payload
      data: { user },
    });
  },
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const user = await authService.verifyUser(email, password);
    const token = signToken(user._id.toString(), user.role);

    res.cookie("token", token, {
      httpOnly: true,
      secure: config.env === "production",
      sameSite: config.env === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(httpStatus.OK).json({
      status: "success",
      token, // 💡 CRITICAL: Ensure token is passed explicitly in response payload
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          interests: user.interests,
          location: user.location,
          image: user.image,
        },
      },
    });
  },
);

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1. Grab the user safely attached by your 'protect' middleware
    const currentUser = (req as any).user;

    if (!currentUser) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        status: "fail",
        message: "User context missing. Please log in again.",
      });
    }

    // 2. Clear browser cache headers to stop the 304 Not Modified redirect loop
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // 3. Match the exact data wrapper structural footprint your frontend expects
    return res.status(httpStatus.OK).json({
      status: "success",
      data: {
        user: {
          id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          image: currentUser.image,
          interests: currentUser.interests,
          location: currentUser.location,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: config.env === "production",
    sameSite: config.env === "production" ? "none" : "lax",
    expires: new Date(0),
  });

  return res.status(200).json({ message: "Logged out successfully" });
};
