import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";

interface CreateReviewInput {
  customerId: string;
  bookingId: string;
  vehicleRating: number;
  partnerRating: number;
  comment?: string;
  imageUrls?: string[];
}

export async function createReview(input: CreateReviewInput) {
  const booking = await prisma.booking.findUnique({ where: { id: input.bookingId } });
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.customerId !== input.customerId) throw ApiError.forbidden();
  if (booking.status !== "COMPLETED") throw ApiError.badRequest("You can only review completed rentals");

  const existing = await prisma.review.findUnique({ where: { bookingId: booking.id } });
  if (existing) throw ApiError.conflict("You have already reviewed this booking");

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        bookingId: booking.id,
        customerId: input.customerId,
        vehicleId: booking.vehicleId,
        rentalPartnerId: booking.rentalPartnerId,
        vehicleRating: input.vehicleRating,
        partnerRating: input.partnerRating,
        comment: input.comment,
        images: input.imageUrls ? { create: input.imageUrls.map((url) => ({ url })) } : undefined,
      },
      include: { images: true },
    });

    await recomputeVehicleRating(tx, booking.vehicleId);
    await recomputePartnerRating(tx, booking.rentalPartnerId);

    return created;
  });

  return review;
}

async function recomputeVehicleRating(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], vehicleId: string) {
  const agg = await tx.review.aggregate({ where: { vehicleId }, _avg: { vehicleRating: true }, _count: true });
  await tx.vehicle.update({
    where: { id: vehicleId },
    data: { averageRating: agg._avg.vehicleRating ?? 0, totalReviews: agg._count },
  });
}

async function recomputePartnerRating(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  rentalPartnerId: string,
) {
  const agg = await tx.review.aggregate({
    where: { rentalPartnerId },
    _avg: { partnerRating: true },
    _count: true,
  });
  await tx.rentalPartner.update({
    where: { id: rentalPartnerId },
    data: { averageRating: agg._avg.partnerRating ?? 0, totalReviews: agg._count },
  });
}
