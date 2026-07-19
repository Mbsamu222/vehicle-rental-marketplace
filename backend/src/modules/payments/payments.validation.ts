import { z } from "zod";

export const createPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  provider: z.enum(["RAZORPAY", "STRIPE", "WALLET"]),
});

export const verifyPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  providerRefId: z.string().min(1),
  providerSignature: z.string().min(1).optional(),
});

export const refundPaymentSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().max(500).optional(),
});
