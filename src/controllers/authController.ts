import { Request, Response, NextFunction } from "express";
import * as authService from "./services/authService.js";
import { signToken } from "../utils/jwt.js";
import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";

export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const newUser = await authService.createUser(req.body);
    const token = signToken(newUser._id.toString());

    // Convert to a plain object and remove the password
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(httpStatus.CREATED).json({
      status: "success",
      token,
      data: {
        user: userResponse, // Send the sanitized version
      },
    });
  },
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const user = await authService.verifyUser(email, password);
    const token = signToken(user._id.toString());

    res.status(httpStatus.OK).json({
      status: "success",
      token,
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
