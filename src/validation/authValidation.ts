import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    // Middleware adds "Name", so we just need "is too short"
    name: z.string().min(2, "is too short"),
    email: z.string().email("is an invalid email address"),
    password: z.string().min(5, "must be at least 5 characters"),
    role: z.enum(["user", "organizer"]).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    // Standard approach: Use .min(1) for the "required" message
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),

    password: z.string().min(1, "Password is required"),
  }),
});
