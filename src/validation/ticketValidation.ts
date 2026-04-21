import { z } from "zod";

export const bookTicketSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Event ID"),
    tierName: z.string().min(1, "Please select a ticket tier"),
    quantity: z.number().int().positive().default(1),
  }),
});

export type BookTicketInput = z.infer<typeof bookTicketSchema>["body"];
