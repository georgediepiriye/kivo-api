import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { signupSchema, loginSchema } from "../validation/authValidation.js";
import passport from "passport";
import jwt from "jsonwebtoken";
import config from "../config/config.js";

const router = Router();

router.post("/signup", validate(signupSchema), authController.signup);
router.post("/login", validate(loginSchema), authController.login);
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // User is now authenticated. Generate a Kivo JWT.
    const token = jwt.sign({ id: (req.user as any)._id }, config.jwt.secret!, {
      expiresIn: "7d",
    });

    // Set the cookie
    res.cookie("kivo_auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
      sameSite: "lax", // Helps prevent CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // Redirect to dashboard (No token in the URL anymore!)
    res.redirect(`${config.clientUrl}/profile`);
  },
);

export default router;
