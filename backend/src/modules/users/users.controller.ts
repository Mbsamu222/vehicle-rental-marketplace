import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../config/prisma";
import { sanitizeUser } from "../auth/auth.service";

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.update({ where: { id: req.user!.id }, data: req.body });
  return sendSuccess(res, sanitizeUser(user));
});

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const [activeBookings, completedBookings, wishlistCount, wallet] = await Promise.all([
    prisma.booking.count({ where: { customerId: userId, status: { in: ["CONFIRMED", "APPROVED", "VEHICLE_READY", "PICKED_UP", "ACTIVE", "RETURNING"] } } }),
    prisma.booking.count({ where: { customerId: userId, status: "COMPLETED" } }),
    prisma.wishlistItem.count({ where: { userId } }),
    prisma.wallet.findUnique({ where: { userId } }),
  ]);
  return sendSuccess(res, { activeBookings, completedBookings, wishlistCount, walletBalance: wallet?.balance ?? 0 });
});

export const addDrivingLicense = asyncHandler(async (req: Request, res: Response) => {
  const license = await prisma.drivingLicense.create({
    data: { ...req.body, userId: req.user!.id },
  });
  return sendSuccess(res, license, 201);
});

export const listDrivingLicenses = asyncHandler(async (req: Request, res: Response) => {
  const licenses = await prisma.drivingLicense.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "desc" } });
  return sendSuccess(res, licenses);
});

export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  const item = await prisma.wishlistItem.upsert({
    where: { userId_vehicleId: { userId: req.user!.id, vehicleId } },
    create: { userId: req.user!.id, vehicleId },
    update: {},
  });
  return sendSuccess(res, item, 201);
});

export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  await prisma.wishlistItem.deleteMany({ where: { userId: req.user!.id, vehicleId } });
  return sendSuccess(res, { message: "Removed from wishlist" });
});

export const listWishlist = asyncHandler(async (req: Request, res: Response) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user!.id },
    include: { vehicle: { include: { images: true, brand: true, category: true } } },
    orderBy: { createdAt: "desc" },
  });
  return sendSuccess(res, items);
});

export const addSavedLocation = asyncHandler(async (req: Request, res: Response) => {
  const location = await prisma.savedLocation.create({ data: { ...req.body, userId: req.user!.id } });
  return sendSuccess(res, location, 201);
});

export const listSavedLocations = asyncHandler(async (req: Request, res: Response) => {
  const locations = await prisma.savedLocation.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "desc" } });
  return sendSuccess(res, locations);
});

export const deleteSavedLocation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const location = await prisma.savedLocation.findUnique({ where: { id } });
  if (!location || location.userId !== req.user!.id) throw ApiError.notFound("Saved location not found");
  await prisma.savedLocation.delete({ where: { id } });
  return sendSuccess(res, { message: "Deleted" });
});
