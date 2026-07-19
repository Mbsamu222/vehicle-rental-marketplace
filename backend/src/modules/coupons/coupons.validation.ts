import { z } from "zod";

export const createCouponSchema = z.object({
  code: z.string().min(3).max(30).toUpperCase(),
  type: z.enum(["FLAT", "PERCENTAGE"]),
  value: z.number().positive(),
  maxDiscount: z.number().positive().optional(),
  minBookingValue: z.number().min(0).optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
});

export const updateCouponSchema = createCouponSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  bookingAmount: z.number().positive(),
});
