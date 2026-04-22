import { Request, Response } from "express";
import * as userService from "./services/userService.js";

export const getProfile = async (req: Request, res: Response) => {
  try {
    // req.user.id should be populated by your Auth Middleware
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const profile = await userService.getUserProfile(userId);

    return res.status(200).json({
      status: "success",
      data: profile,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
