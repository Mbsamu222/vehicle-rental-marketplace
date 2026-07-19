import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, paginationMeta } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../config/prisma";
import { getPagination } from "../../utils/pagination";
import * as bookingsService from "./bookings.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingsService.createBooking({ ...req.body, customerId: req.user!.id });
  return sendSuccess(res, booking, 201);
});

export const listMyBookings = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPagination(req);
  const { status } = req.query as { status?: string };

  const where = { customerId: req.user!.id, ...(status ? { status: status as never } : {}) };
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { vehicle: { include: { images: true } }, rentalPartner: true },
    }),
    prisma.booking.count({ where }),
  ]);
  return sendSuccess(res, bookings, 200, paginationMeta(page, limit, total));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      vehicle: { include: { images: true } },
      rentalPartner: true,
      customer: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      payments: true,
      invoice: true,
      coupon: true,
    },
  });
  if (!booking) throw ApiError.notFound("Booking not found");

  const isOwner = booking.customerId === req.user!.id;
  const isPartner = req.user!.userType === "RENTAL_PARTNER";
  const isAdmin = req.user!.userType === "ADMIN" || req.user!.userType === "SUPER_ADMIN";
  if (!isOwner && !isPartner && !isAdmin) throw ApiError.forbidden();

  return sendSuccess(res, booking);
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.customerId !== req.user!.id) throw ApiError.forbidden();

  const updated = await bookingsService.transitionStatus(booking.id, "CANCELLED", req.user!.id, req.body.reason);
  return sendSuccess(res, updated);
});

// ─── Rental partner ───

export const listPartnerBookings = asyncHandler(async (req: Request, res: Response) => {
  const partner = await prisma.rentalPartner.findUnique({ where: { userId: req.user!.id } });
  if (!partner) throw ApiError.notFound("Rental partner profile not found");

  const { page, limit, skip, take } = getPagination(req);
  const { status } = req.query as { status?: string };
  const where = { rentalPartnerId: partner.id, ...(status ? { status: status as never } : {}) };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { vehicle: true, customer: true },
    }),
    prisma.booking.count({ where }),
  ]);
  return sendSuccess(res, bookings, 200, paginationMeta(page, limit, total));
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id }, include: { rentalPartner: true } });
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.rentalPartner.userId !== req.user!.id) throw ApiError.forbidden();

  const updated = await bookingsService.transitionStatus(booking.id, req.body.status, req.user!.id, req.body.note);
  return sendSuccess(res, updated);
});
