import { z } from "zod";
import { EVENT_CATEGORIES, EVENT_TYPES } from "../lib/constants";

export const createEventSchema = z.object({
  body: z
    .object({
      title: z
        .string()
        .min(5, "Title must be at least 5 characters")
        .max(100, "Title cannot exceed 100 characters"),

      description: z
        .string()
        .min(20, "Please provide a more detailed description (min 20 chars)"),

      type: z.enum(Object.keys(EVENT_TYPES) as [string, ...string[]]),
      category: z.enum(Object.keys(EVENT_CATEGORIES) as [string, ...string[]]),
      tags: z.array(z.string()).optional().default([]),

      startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Please provide a valid start date and time",
      }),

      endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Please provide a valid end date and time",
      }),

      // Location
      location: z.object({
        type: z.literal("Point"),
        coordinates: z.tuple([
          z.number().min(-180).max(180), // lng
          z.number().min(-90).max(90), // lat
        ]),
        address: z.string().min(1, "Address is required"),
        neighborhood: z.string().optional().default("Port Harcourt"),
      }),

      // Privacy & Access
      isPublic: z.boolean().default(true),
      allowAnonymous: z.boolean().default(true),
      ageRestriction: z.string().default("All Ages"),

      // Financials & Ticketing
      isFree: z.boolean(),
      externalTicketLink: z.string().url("Invalid URL").nullable().optional(),

      // Supporting multiple tiers
      ticketTiers: z
        .array(
          z.object({
            name: z.string().min(1, "Tier name is required"),
            price: z.number().min(0),
            capacity: z.number().int().positive(),
            description: z.string().optional(),
          }),
        )
        .optional()
        .default([]),

      totalCapacity: z.number().int().positive().nullable().optional(),
      refundPolicy: z.enum(["none", "flexible", "24h"]).default("none"),
      organizerType: z.enum(["individual", "business"]).default("individual"),
      status: z.enum(["casual", "pro"]).default("casual"),
    })
    .refine(
      (data) => {
        // If it's not free and there's no external link, there MUST be ticket tiers
        if (!data.isFree && !data.externalTicketLink) {
          return data.ticketTiers && data.ticketTiers.length > 0;
        }
        return true;
      },
      {
        message:
          "Paid events must have at least one ticket tier or an external ticket link.",
        path: ["ticketTiers"],
      },
    ),
});

export type CreateEventInput = z.infer<typeof createEventSchema>["body"];
