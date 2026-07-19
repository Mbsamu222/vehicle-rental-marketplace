import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, paginationMeta } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../config/prisma";
import { getPagination } from "../../utils/pagination";
import * as reviewsService from "./reviews.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewsService.createReview({ ...req.body, customerId: req.user!.id });
  return sendSuccess(res, review, 201);
});

export const listByVehicle = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPagination(req);
  const where = { vehicleId: req.params.vehicleId };
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { customer: true, images: true, replies: true },
    }),
    prisma.review.count({ where }),
  ]);
  return sendSuccess(res, reviews, 200, paginationMeta(page, limit, total));
});

export const listByPartner = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPagination(req);
  const where = { rentalPartnerId: req.params.rentalPartnerId };
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { customer: true, images: true, replies: true },
    }),
    prisma.review.count({ where }),
  ]);
  return sendSuccess(res, reviews, 200, paginationMeta(page, limit, total));
});

export const reply = asyncHandler(async (req: Request, res: Response) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id }, include: { rentalPartner: true } });
  if (!review) throw ApiError.notFound("Review not found");

  const isOwningPartner = review.rentalPartner.userId === req.user!.id;
  const isAdmin = req.user!.userType === "ADMIN" || req.user!.userType === "SUPER_ADMIN";
  if (!isOwningPartner && !isAdmin) throw ApiError.forbidden();

  const created = await prisma.reviewReply.create({
    data: { reviewId: review.id, authorId: req.user!.id, message: req.body.message },
  });
  return sendSuccess(res, created, 201);
});

export const report = asyncHandler(async (req: Request, res: Response) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) throw ApiError.notFound("Review not found");

  const created = await prisma.$transaction(async (tx) => {
    const reportEntry = await tx.reviewReport.create({
      data: { reviewId: review.id, reportedById: req.user!.id, reason: req.body.reason },
    });
    await tx.review.update({ where: { id: review.id }, data: { isReported: true } });
    return reportEntry;
  });

  return sendSuccess(res, created, 201);
});
