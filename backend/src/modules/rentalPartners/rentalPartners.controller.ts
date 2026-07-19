import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, paginationMeta } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../config/prisma";
import { getPagination } from "../../utils/pagination";

async function getOwnedPartnerOrThrow(userId: string) {
  const partner = await prisma.rentalPartner.findUnique({ where: { userId } });
  if (!partner) throw ApiError.notFound("Rental partner profile not found. Complete onboarding first.");
  return partner;
}

export const createProfile = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.rentalPartner.findUnique({ where: { userId: req.user!.id } });
  if (existing) throw ApiError.conflict("Rental partner profile already exists");

  const partner = await prisma.rentalPartner.create({
    data: { ...req.body, userId: req.user!.id },
  });
  return sendSuccess(res, partner, 201);
});

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const partner = await prisma.rentalPartner.findUnique({
    where: { userId: req.user!.id },
    include: { documents: true, bankDetails: true, city: true },
  });
  if (!partner) throw ApiError.notFound("Rental partner profile not found");
  return sendSuccess(res, partner);
});

export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const partner = await getOwnedPartnerOrThrow(req.user!.id);
  const updated = await prisma.rentalPartner.update({ where: { id: partner.id }, data: req.body });
  return sendSuccess(res, updated);
});

export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  const partner = await getOwnedPartnerOrThrow(req.user!.id);
  const document = await prisma.businessDocument.create({
    data: { ...req.body, rentalPartnerId: partner.id },
  });
  return sendSuccess(res, document, 201);
});

export const setBankDetails = asyncHandler(async (req: Request, res: Response) => {
  const partner = await getOwnedPartnerOrThrow(req.user!.id);
  const bankDetails = await prisma.bankDetail.upsert({
    where: { rentalPartnerId: partner.id },
    create: { ...req.body, rentalPartnerId: partner.id },
    update: req.body,
  });
  return sendSuccess(res, bankDetails);
});

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const partner = await getOwnedPartnerOrThrow(req.user!.id);

  const [totalVehicles, activeBookings, pendingRequests, completedBookings, revenueAgg] = await Promise.all([
    prisma.vehicle.count({ where: { rentalPartnerId: partner.id } }),
    prisma.booking.count({
      where: { rentalPartnerId: partner.id, status: { in: ["APPROVED", "VEHICLE_READY", "PICKED_UP", "ACTIVE", "RETURNING"] } },
    }),
    prisma.booking.count({ where: { rentalPartnerId: partner.id, status: "PENDING" } }),
    prisma.booking.count({ where: { rentalPartnerId: partner.id, status: "COMPLETED" } }),
    prisma.booking.aggregate({
      where: { rentalPartnerId: partner.id, status: "COMPLETED" },
      _sum: { totalAmount: true },
    }),
  ]);

  return sendSuccess(res, {
    totalVehicles,
    activeBookings,
    pendingRequests,
    completedBookings,
    totalRevenue: revenueAgg._sum.totalAmount ?? 0,
    averageRating: partner.averageRating,
    verificationStatus: partner.verificationStatus,
  });
});

// ─── Admin ───

export const listPartners = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPagination(req);
  const { status } = req.query as { status?: string };

  const where = status ? { verificationStatus: status as never } : {};
  const [partners, total] = await Promise.all([
    prisma.rentalPartner.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, include: { city: true } }),
    prisma.rentalPartner.count({ where }),
  ]);

  return sendSuccess(res, partners, 200, paginationMeta(page, limit, total));
});

export const getPartnerById = asyncHandler(async (req: Request, res: Response) => {
  const partner = await prisma.rentalPartner.findUnique({
    where: { id: req.params.id },
    include: { documents: true, bankDetails: true, city: true, user: true },
  });
  if (!partner) throw ApiError.notFound("Rental partner not found");
  return sendSuccess(res, partner);
});

export const updateVerificationStatus = asyncHandler(async (req: Request, res: Response) => {
  const partner = await prisma.rentalPartner.update({
    where: { id: req.params.id },
    data: { verificationStatus: req.body.status },
  });
  return sendSuccess(res, partner);
});

export const reviewDocument = asyncHandler(async (req: Request, res: Response) => {
  const document = await prisma.businessDocument.update({
    where: { id: req.params.documentId },
    data: {
      status: req.body.status,
      rejectionReason: req.body.rejectionReason,
      reviewedAt: new Date(),
    },
  });
  return sendSuccess(res, document);
});
