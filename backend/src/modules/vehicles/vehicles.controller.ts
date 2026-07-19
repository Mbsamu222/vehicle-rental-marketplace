import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, paginationMeta } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../config/prisma";
import { getPagination } from "../../utils/pagination";
import { findUnavailableVehicleIds } from "./vehicles.service";

async function getOwnedVehicleOrThrow(vehicleId: string, userId: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, include: { rentalPartner: true } });
  if (!vehicle) throw ApiError.notFound("Vehicle not found");
  if (vehicle.rentalPartner.userId !== userId) throw ApiError.forbidden("You do not own this vehicle");
  return vehicle;
}

export const search = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as {
    cityId?: string;
    categoryId?: string;
    brandId?: string;
    transmission?: "MANUAL" | "AUTOMATIC";
    fuelType?: "PETROL" | "DIESEL" | "ELECTRIC" | "HYBRID" | "CNG";
    minPrice?: number;
    maxPrice?: number;
    seatingCapacity?: number;
    pickupDatetime?: Date;
    returnDatetime?: Date;
    sortBy?: "price_asc" | "price_desc" | "rating" | "newest";
  };
  const { page, limit, skip, take } = getPagination(req);

  const where: Prisma.VehicleWhereInput = {
    isActive: true,
    approvalStatus: "APPROVED",
    ...(query.cityId ? { cityId: query.cityId } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.brandId ? { brandId: query.brandId } : {}),
    ...(query.transmission ? { transmission: query.transmission } : {}),
    ...(query.fuelType ? { fuelType: query.fuelType } : {}),
    ...(query.seatingCapacity ? { seatingCapacity: { gte: query.seatingCapacity } } : {}),
    ...(query.minPrice || query.maxPrice
      ? {
          pricePerDay: {
            ...(query.minPrice ? { gte: query.minPrice } : {}),
            ...(query.maxPrice ? { lte: query.maxPrice } : {}),
          },
        }
      : {}),
  };

  if (query.pickupDatetime && query.returnDatetime) {
    const unavailableIds = await findUnavailableVehicleIds(query.pickupDatetime, query.returnDatetime);
    if (unavailableIds.length) {
      where.id = { notIn: unavailableIds };
    }
  }

  const orderBy: Prisma.VehicleOrderByWithRelationInput =
    query.sortBy === "price_asc"
      ? { pricePerDay: "asc" }
      : query.sortBy === "price_desc"
        ? { pricePerDay: "desc" }
        : query.sortBy === "rating"
          ? { averageRating: "desc" }
          : { createdAt: "desc" };

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take,
      orderBy,
      include: { images: true, brand: true, category: true, city: true, rentalPartner: true },
    }),
    prisma.vehicle.count({ where }),
  ]);

  return sendSuccess(res, vehicles, 200, paginationMeta(page, limit, total));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id },
    include: {
      images: true,
      brand: true,
      category: true,
      city: true,
      rentalPartner: true,
      reviews: { include: { customer: true, images: true }, orderBy: { createdAt: "desc" }, take: 10 },
      availability: true,
    },
  });
  if (!vehicle) throw ApiError.notFound("Vehicle not found");
  return sendSuccess(res, vehicle);
});

export const checkAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { pickupDatetime, returnDatetime } = req.query as unknown as { pickupDatetime: Date; returnDatetime: Date };
  const unavailableIds = await findUnavailableVehicleIds(pickupDatetime, returnDatetime);
  return sendSuccess(res, { available: !unavailableIds.includes(req.params.id) });
});

// ─── Rental Partner ───

export const createVehicle = asyncHandler(async (req: Request, res: Response) => {
  const partner = await prisma.rentalPartner.findUnique({ where: { userId: req.user!.id } });
  if (!partner) throw ApiError.notFound("Complete your rental partner profile first");
  if (partner.verificationStatus !== "VERIFIED") {
    throw ApiError.forbidden("Your business must be verified before listing vehicles");
  }

  const vehicle = await prisma.vehicle.create({
    data: { ...req.body, rentalPartnerId: partner.id },
  });
  return sendSuccess(res, vehicle, 201);
});

export const updateVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await getOwnedVehicleOrThrow(req.params.id, req.user!.id);
  const updated = await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: { ...req.body, approvalStatus: "PENDING" }, // edits require re-approval
  });
  return sendSuccess(res, updated);
});

export const deleteVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await getOwnedVehicleOrThrow(req.params.id, req.user!.id);
  await prisma.vehicle.update({ where: { id: vehicle.id }, data: { isActive: false } });
  return sendSuccess(res, { message: "Vehicle deactivated" });
});

export const listMyVehicles = asyncHandler(async (req: Request, res: Response) => {
  const partner = await prisma.rentalPartner.findUnique({ where: { userId: req.user!.id } });
  if (!partner) throw ApiError.notFound("Rental partner profile not found");
  const { page, limit, skip, take } = getPagination(req);

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where: { rentalPartnerId: partner.id },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { images: true, category: true, brand: true },
    }),
    prisma.vehicle.count({ where: { rentalPartnerId: partner.id } }),
  ]);
  return sendSuccess(res, vehicles, 200, paginationMeta(page, limit, total));
});

export const addImages = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await getOwnedVehicleOrThrow(req.params.id, req.user!.id);
  const created = await prisma.vehicleImage.createMany({
    data: req.body.images.map((img: { url: string; isPrimary?: boolean; sortOrder?: number }) => ({
      ...img,
      vehicleId: vehicle.id,
    })),
  });
  return sendSuccess(res, created, 201);
});

export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await getOwnedVehicleOrThrow(req.params.id, req.user!.id);
  await prisma.vehicleImage.deleteMany({ where: { id: req.params.imageId, vehicleId: vehicle.id } });
  return sendSuccess(res, { message: "Image removed" });
});

export const blockAvailability = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await getOwnedVehicleOrThrow(req.params.id, req.user!.id);
  const block = await prisma.vehicleAvailability.create({
    data: { ...req.body, vehicleId: vehicle.id },
  });
  return sendSuccess(res, block, 201);
});

// ─── Admin ───

export const listPendingApproval = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPagination(req);
  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where: { approvalStatus: "PENDING" },
      skip,
      take,
      orderBy: { createdAt: "asc" },
      include: { rentalPartner: true, images: true },
    }),
    prisma.vehicle.count({ where: { approvalStatus: "PENDING" } }),
  ]);
  return sendSuccess(res, vehicles, 200, paginationMeta(page, limit, total));
});

export const reviewVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await prisma.vehicle.update({
    where: { id: req.params.id },
    data: { approvalStatus: req.body.status, rejectionReason: req.body.rejectionReason },
  });
  return sendSuccess(res, vehicle);
});
