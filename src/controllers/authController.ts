import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { signToken } from "../utils/jwt";
import httpStatus from "http-status";

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const newUser = await authService.createUser(req.body);
    const token = signToken(newUser._id.toString());

    res.status(httpStatus.CREATED).json({
      status: "success",
      token,
      data: { user: newUser },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
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
  } catch (error) {
    next(error);
  }
};
