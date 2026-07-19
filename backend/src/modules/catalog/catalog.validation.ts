import { z } from "zod";

export const createCountrySchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(2).max(3),
});

export const createCitySchema = z.object({
  name: z.string().min(1).max(100),
  countryId: z.string().uuid(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isPopular: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  iconUrl: z.string().url().optional(),
});

export const createBrandSchema = z.object({
  name: z.string().min(1).max(100),
  logoUrl: z.string().url().optional(),
});
