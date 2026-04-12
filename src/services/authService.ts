import { User, IUser } from "../models/userModel";
import AppError from "../utils/appError";
import httpStatus from "http-status";

export const createUser = async (userData: Partial<IUser>) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email already in use");
  }

  return await User.create(userData);
};

export const verifyUser = async (
  email: string,
  password: string,
): Promise<IUser> => {
  // 1. Find user and explicitly include password (since it's select: false)
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password!))) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }

  return user;
};
