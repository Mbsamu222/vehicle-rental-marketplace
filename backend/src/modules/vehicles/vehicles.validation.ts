import { z } from "zod";

export const createVehicleSchema = z.object({
  categoryId: z.string().uuid(),
  brandId: z.string().uuid(),
  cityId: z.string().uuid(),
  model: z.string().min(1).max(150),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  registrationNumber: z.string().min(3).max(30),
  transmission: z.enum(["MANUAL", "AUTOMATIC"]),
  fuelType: z.enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "CNG"]),
  seatingCapacity: z.number().int().min(1).max(100),
  pricePerHour: z.number().positive(),
  pricePerDay: z.number().positive(),
  securityDeposit: z.number().min(0).default(0),
  insuranceDetails: z.string().max(2000).optional(),
  rentalPolicies: z.string().max(4000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const addImagesSchema = z.object({
  images: z
    .array(
      z.object({
        url: z.string().url(),
        isPrimary: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .min(1),
});

export const blockAvailabilitySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().max(200).optional(),
});

export const approveVehicleSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().max(500).optional(),
});

export const searchVehiclesSchema = z.object({
  cityId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  transmission: z.enum(["MANUAL", "AUTOMATIC"]).optional(),
  fuelType: z.enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "CNG"]).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  seatingCapacity: z.coerce.number().int().optional(),
  pickupDatetime: z.coerce.date().optional(),
  returnDatetime: z.coerce.date().optional(),
  sortBy: z.enum(["price_asc", "price_desc", "rating", "newest"]).optional(),
  page: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().optional(),
});
