import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, paginationMeta } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../config/prisma";
import { getPagination } from "../../utils/pagination";

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, bookingAmount } = req.body;
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

  if (!coupon || !coupon.isActive || coupon.validFrom > new Date() || coupon.validUntil < new Date()) {
    throw ApiError.badRequest("Coupon is invalid or expired");
  }
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    throw ApiError.badRequest("Coupon usage limit reached");
  }
  if (coupon.minBookingValue && bookingAmount < Number(coupon.minBookingValue)) {
    throw ApiError.badRequest(`Minimum booking amount for this coupon is ${coupon.minBookingValue}`);
  }

  let discount = coupon.type === "PERCENTAGE" ? (bookingAmount * Number(coupon.value)) / 100 : Number(coupon.value);
  if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
  discount = Math.min(discount, bookingAmount);

  return sendSuccess(res, { code: coupon.code, discount: Number(discount.toFixed(2)) });
});

// ─── Admin ───

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPagination(req);
  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({ skip, take, orderBy: { createdAt: "desc" } }),
    prisma.coupon.count(),
  ]);
  return sendSuccess(res, coupons, 200, paginationMeta(page, limit, total));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await prisma.coupon.create({ data: req.body });
  return sendSuccess(res, coupon, 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: req.body });
  return sendSuccess(res, coupon);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await prisma.coupon.update({ where: { id: req.params.id }, data: { isActive: false } });
  return sendSuccess(res, { message: "Coupon deactivated" });
});
