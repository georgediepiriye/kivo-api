import { User, IUser } from "../../models/User.js";

import httpStatus from "http-status";
import AppError from "../../utils/AppError.js";

export const createUser = async (userData: Partial<IUser>) => {
  const existingUser = await User.findOne({ email: userData.email });

  if (existingUser) {
    // Check if they are a Google user trying to sign up manually
    if (existingUser.googleId && !existingUser.password) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This email is linked to a Google account. Please log in with Google or reset your password to add manual login.",
      );
    }
    throw new AppError(httpStatus.BAD_REQUEST, "Email already in use");
  }

  return await User.create(userData);
};

export const verifyUser = async (
  email: string,
  password: string,
): Promise<IUser> => {
  // 1. Find user and explicitly include password and googleId
  const user = await User.findOne({ email }).select("+password +googleId");

  // 2. Check if user exists
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }

  /**
   * 3. Handle Social Login Users
   * If they have no password but have a googleId, they must use Google Sign-in.
   * This prevents them from being "locked out" by a generic unauthorized error
   * and tells them exactly how to fix it.
   */
  if (!user.password && user.googleId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This account was created via Google. Please log in with Google.",
    );
  }

  /**
   * 4. Verify Password
   * We check if user.password exists before calling correctPassword.
   * If a user somehow has no password AND no googleId, we fail them here.
   */
  if (
    !user.password ||
    !(await user.correctPassword(password, user.password))
  ) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }

  return user;
};

export const getAuthenticatedUser = async (userId: string) => {
  // Logic to interact with the database
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const logoutUser = async () => {
  return { success: true };
};
