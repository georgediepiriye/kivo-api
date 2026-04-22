import { User } from "../../models/User.js";

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
