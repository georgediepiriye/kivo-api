import { User, IUser } from "../../models/User.js";
import logger from "../../utils/logger.js"; // Import your winston logger

export const getUserProfile = async (userId: string) => {
  logger.debug(`Profile Fetch Attempt: UserID=${userId}`);

  const user = await User.findById(userId).select("-password").lean();

  if (!user) {
    logger.warn(`Profile Fetch Failed: UserID ${userId} not found`);
    throw new Error("User profile not found");
  }

  return user;
};

export const updateUserProfile = async (
  userId: string,
  updateData: Partial<IUser>,
) => {
  const updatedFields = Object.keys(updateData);
  logger.info(
    `Profile Update Initiated: UserID=${userId} Fields=[${updatedFields.join(", ")}]`,
  );

  // 1. Remove undefined fields
  Object.keys(updateData).forEach(
    (key) =>
      (updateData as any)[key] === undefined && delete (updateData as any)[key],
  );

  // 2. Specialized handling for nested location
  const updateQuery: any = { $set: updateData };

  try {
    // 3. Find and Update
    const user = await User.findByIdAndUpdate(userId, updateQuery, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      logger.error(
        `Profile Update Failed: UserID ${userId} not found during update`,
      );
      throw new Error("User not found");
    }

    logger.info(`Profile Update Successful: UserID=${userId}`);
    return user;
  } catch (error: any) {
    logger.error(`Profile Update Error: UserID=${userId} - ${error.message}`);
    throw error;
  }
};
