import { z } from "zod";

export const createBookingSchema = z
  .object({
    vehicleId: z.string().uuid(),
    drivingLicenseId: z.string().uuid(),
    pickupDatetime: z.coerce.date(),
    returnDatetime: z.coerce.date(),
    pickupLocation: z.string().min(1),
    returnLocation: z.string().min(1),
    couponCode: z.string().optional(),
  })
  .refine((data) => data.returnDatetime > data.pickupDatetime, {
    message: "returnDatetime must be after pickupDatetime",
    path: ["returnDatetime"],
  });

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum([
    "APPROVED",
    "REJECTED",
    "VEHICLE_READY",
    "PICKED_UP",
    "ACTIVE",
    "RETURNING",
    "COMPLETED",
  ]),
  note: z.string().max(500).optional(),
});
