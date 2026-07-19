import { z } from "zod";

export const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(4000),
});

export const addMessageSchema = z.object({
  message: z.string().min(1).max(4000),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
});
