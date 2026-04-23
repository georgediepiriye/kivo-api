import { User, IUser } from "../../models/User.js";

export const getUserProfile = async (userId: string) => {
  // We fetch more details here than we do for the Navbar
  const user = await User.findById(userId)
    .select("-password") // Never send the password
    .lean(); // .lean() makes the query faster by returning a plain JS object

  if (!user) {
    throw new Error("User profile not found");
  }
  return user;
};

export const updateUserProfile = async (
  userId: string,
  updateData: Partial<IUser>,
) => {
  // 1. Remove undefined fields
  Object.keys(updateData).forEach(
    (key) =>
      (updateData as any)[key] === undefined && delete (updateData as any)[key],
  );

  // 2. Specialized handling for nested location to prevent wiping out defaults
  // If the user sends a location object, we merge it with the existing structure
  const updateQuery: any = { $set: updateData };

  // 3. Find and Update
  const user = await User.findByIdAndUpdate(userId, updateQuery, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};
