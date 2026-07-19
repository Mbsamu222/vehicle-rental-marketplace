import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { isVehicleAvailable } from "../vehicles/vehicles.service";
import { notify } from "../notifications/notifications.service";
import type { BookingStatus } from "@prisma/client";

const TAX_RATE = 0.18; // 18% — matches most GST-style jurisdictions; make configurable per-region later.

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["VEHICLE_READY", "CANCELLED"],
  REJECTED: [],
  VEHICLE_READY: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["ACTIVE"],
  ACTIVE: ["RETURNING"],
  RETURNING: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

function generateBookingNumber(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BK-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

interface PriceBreakdown {
  basePrice: number;
  discountAmount: number;
  taxAmount: number;
  securityDeposit: number;
  totalAmount: number;
}

export function calculatePrice(params: {
  pricePerHour: number;
  pricePerDay: number;
  securityDeposit: number;
  pickup: Date;
  return: Date;
  coupon?: { type: "FLAT" | "PERCENTAGE"; value: number; maxDiscount?: number | null };
}): PriceBreakdown {
  const durationMs = params.return.getTime() - params.pickup.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  const fullDays = Math.floor(durationHours / 24);
  const remainingHours = Math.ceil(durationHours - fullDays * 24);

  const basePrice = fullDays * params.pricePerDay + remainingHours * params.pricePerHour;

  let discountAmount = 0;
  if (params.coupon) {
    discountAmount =
      params.coupon.type === "PERCENTAGE" ? (basePrice * params.coupon.value) / 100 : params.coupon.value;
    if (params.coupon.maxDiscount) discountAmount = Math.min(discountAmount, params.coupon.maxDiscount);
    discountAmount = Math.min(discountAmount, basePrice);
  }

  const taxableAmount = basePrice - discountAmount;
  const taxAmount = Number((taxableAmount * TAX_RATE).toFixed(2));
  const totalAmount = Number((taxableAmount + taxAmount + params.securityDeposit).toFixed(2));

  return {
    basePrice: Number(basePrice.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    taxAmount,
    securityDeposit: params.securityDeposit,
    totalAmount,
  };
}

interface CreateBookingInput {
  customerId: string;
  vehicleId: string;
  drivingLicenseId: string;
  pickupDatetime: Date;
  returnDatetime: Date;
  pickupLocation: string;
  returnLocation: string;
  couponCode?: string;
}

export async function createBooking(input: CreateBookingInput) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle || !vehicle.isActive || vehicle.approvalStatus !== "APPROVED") {
    throw ApiError.badRequest("Vehicle is not available for booking");
  }

  const license = await prisma.drivingLicense.findUnique({ where: { id: input.drivingLicenseId } });
  if (!license || license.userId !== input.customerId) {
    throw ApiError.badRequest("Invalid driving license");
  }
  if (license.status !== "VERIFIED") {
    throw ApiError.badRequest("Your driving license must be verified before booking");
  }
  if (license.expiryDate < input.returnDatetime) {
    throw ApiError.badRequest("Your driving license expires before the rental period ends");
  }

  const available = await isVehicleAvailable(input.vehicleId, input.pickupDatetime, input.returnDatetime);
  if (!available) throw ApiError.conflict("Vehicle is not available for the selected dates");

  let coupon = null;
  if (input.couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: input.couponCode } });
    if (!coupon || !coupon.isActive || coupon.validFrom > new Date() || coupon.validUntil < new Date()) {
      throw ApiError.badRequest("Coupon is invalid or expired");
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw ApiError.badRequest("Coupon usage limit reached");
    }
    const userUsage = await prisma.booking.count({
      where: { customerId: input.customerId, couponId: coupon.id, status: { not: "CANCELLED" } },
    });
    if (userUsage >= coupon.perUserLimit) {
      throw ApiError.badRequest("You have already used this coupon");
    }
  }

  const pricing = calculatePrice({
    pricePerHour: Number(vehicle.pricePerHour),
    pricePerDay: Number(vehicle.pricePerDay),
    securityDeposit: Number(vehicle.securityDeposit),
    pickup: input.pickupDatetime,
    return: input.returnDatetime,
    coupon: coupon
      ? { type: coupon.type, value: Number(coupon.value), maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null }
      : undefined,
  });

  if (coupon && pricing.basePrice < Number(coupon.minBookingValue ?? 0)) {
    throw ApiError.badRequest("Booking amount does not meet the coupon's minimum value");
  }

  const booking = await prisma.$transaction(async (tx) => {
    const created = await tx.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        customerId: input.customerId,
        vehicleId: input.vehicleId,
        rentalPartnerId: vehicle.rentalPartnerId,
        drivingLicenseId: input.drivingLicenseId,
        couponId: coupon?.id,
        pickupDatetime: input.pickupDatetime,
        returnDatetime: input.returnDatetime,
        pickupLocation: input.pickupLocation,
        returnLocation: input.returnLocation,
        status: "PENDING",
        ...pricing,
      },
    });

    await tx.bookingStatusHistory.create({
      data: { bookingId: created.id, status: "PENDING", note: "Booking created, awaiting payment" },
    });

    if (coupon) {
      await tx.coupon.update({ where: { id: coupon.id }, data: { usageCount: { increment: 1 } } });
    }

    return created;
  });

  return booking;
}

export async function transitionStatus(
  bookingId: string,
  nextStatus: BookingStatus,
  actorId: string,
  note?: string,
) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw ApiError.notFound("Booking not found");

  const allowed = ALLOWED_TRANSITIONS[booking.status];
  if (!allowed.includes(nextStatus)) {
    throw ApiError.badRequest(`Cannot transition booking from ${booking.status} to ${nextStatus}`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.booking.update({ where: { id: bookingId }, data: { status: nextStatus } });
    await tx.bookingStatusHistory.create({
      data: { bookingId, status: nextStatus, note, changedById: actorId },
    });

    if (nextStatus === "COMPLETED") {
      await tx.vehicle.update({ where: { id: booking.vehicleId }, data: { totalBookings: { increment: 1 } } });
    }

    return result;
  });

  await notify(
    booking.customerId,
    "Booking update",
    `Your booking ${booking.bookingNumber} is now ${nextStatus.replace(/_/g, " ").toLowerCase()}.`,
    "IN_APP",
    { bookingId, status: nextStatus },
  );

  return updated;
}
