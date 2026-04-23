import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name cannot exceed 50 characters")
      .optional(),

    email: z
      .string()
      .email("Please provide a valid email address")
      .lowercase()
      .optional(),

    image: z.string().url("Invalid image URL").optional(),

    bio: z.string().max(160, "Bio cannot exceed 160 characters").optional(),

    interests: z
      .array(z.string())
      .max(10, "You can select up to 10 interests")
      .optional(),

    location: z
      .object({
        type: z.literal("Point").default("Point"),
        coordinates: z.tuple([
          z.number().min(-180).max(180), // longitude
          z.number().min(-90).max(90), // latitude
        ]),
        address: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().default("Port Harcourt"),
      })
      .optional(),

    active: z.boolean().optional(),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];
