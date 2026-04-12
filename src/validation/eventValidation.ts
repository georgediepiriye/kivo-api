import { z } from "zod";
import { EVENT_CATEGORIES, EVENT_TYPES } from "../lib/constants";

export const createEventSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(5, "Title must be at least 5 characters")
      .max(100, "Title cannot exceed 100 characters"),

    description: z
      .string()
      .min(20, "Please provide a more detailed description (min 20 chars)"),

    // Dynamically pull allowed keys from your constants
    type: z.enum(Object.keys(EVENT_TYPES) as [string, ...string[]]),
    category: z.enum(Object.keys(EVENT_CATEGORIES) as [string, ...string[]]),

    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Please provide a valid start date and time",
    }),

    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Please provide a valid end date and time",
    }),

    // Map Coordinates
    lng: z.number().min(-180).max(180),
    lat: z.number().min(-90).max(90),

    address: z.string().min(1, "Address is required"),
    neighborhood: z.string().min(1, "Neighborhood is required"),

    // Privacy & Access
    isPublic: z.boolean().default(true),
    allowAnonymous: z.boolean().default(true),

    // Financials
    isFree: z.boolean(),
    price: z.number().min(0).optional().default(0),

    // Capacity & Organizers
    capacity: z.number().int().positive().optional().nullable(),
    organizerType: z.enum(["individual", "business"]).default("individual"),
  }),
});

export type CreateEventInput = z.infer<typeof createEventSchema>["body"];
