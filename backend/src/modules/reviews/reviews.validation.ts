import { z } from "zod";

export const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  vehicleRating: z.number().int().min(1).max(5),
  partnerRating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  imageUrls: z.array(z.string().url()).max(6).optional(),
});

export const replySchema = z.object({
  message: z.string().min(1).max(1000),
});

export const reportSchema = z.object({
  reason: z.string().min(1).max(500),
});
