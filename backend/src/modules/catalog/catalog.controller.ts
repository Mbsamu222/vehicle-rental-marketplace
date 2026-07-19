import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { prisma } from "../../config/prisma";

// Countries
export const listCountries = asyncHandler(async (_req: Request, res: Response) => {
  const countries = await prisma.country.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  return sendSuccess(res, countries);
});

export const createCountry = asyncHandler(async (req: Request, res: Response) => {
  const country = await prisma.country.create({ data: req.body });
  return sendSuccess(res, country, 201);
});

// Cities
export const listCities = asyncHandler(async (req: Request, res: Response) => {
  const { countryId, popular } = req.query as { countryId?: string; popular?: string };
  const cities = await prisma.city.findMany({
    where: {
      isActive: true,
      ...(countryId ? { countryId } : {}),
      ...(popular === "true" ? { isPopular: true } : {}),
    },
    orderBy: { name: "asc" },
    include: { country: true },
  });
  return sendSuccess(res, cities);
});

export const createCity = asyncHandler(async (req: Request, res: Response) => {
  const city = await prisma.city.create({ data: req.body });
  return sendSuccess(res, city, 201);
});

// Vehicle categories
export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await prisma.vehicleCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  return sendSuccess(res, categories);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await prisma.vehicleCategory.create({ data: req.body });
  return sendSuccess(res, category, 201);
});

// Vehicle brands
export const listBrands = asyncHandler(async (_req: Request, res: Response) => {
  const brands = await prisma.vehicleBrand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  return sendSuccess(res, brands);
});

export const createBrand = asyncHandler(async (req: Request, res: Response) => {
  const brand = await prisma.vehicleBrand.create({ data: req.body });
  return sendSuccess(res, brand, 201);
});
