import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  avatarUrl: z.string().url().optional(),
});

export const addDrivingLicenseSchema = z.object({
  licenseNumber: z.string().min(4).max(50),
  frontImageUrl: z.string().url(),
  backImageUrl: z.string().url().optional(),
  expiryDate: z.coerce.date(),
});

export const addSavedLocationSchema = z.object({
  cityId: z.string().uuid(),
  label: z.string().min(1).max(100),
  address: z.string().min(1),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
