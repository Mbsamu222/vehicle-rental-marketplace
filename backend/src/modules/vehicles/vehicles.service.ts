import { prisma } from "../../config/prisma";

const BLOCKING_BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "APPROVED",
  "VEHICLE_READY",
  "PICKED_UP",
  "ACTIVE",
  "RETURNING",
] as const;

/** Vehicle IDs that have a conflicting booking or manual availability block in the given window. */
export async function findUnavailableVehicleIds(pickup: Date, ret: Date): Promise<string[]> {
  const [conflictingBookings, conflictingBlocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: { in: [...BLOCKING_BOOKING_STATUSES] },
        pickupDatetime: { lt: ret },
        returnDatetime: { gt: pickup },
      },
      select: { vehicleId: true },
    }),
    prisma.vehicleAvailability.findMany({
      where: { startDate: { lt: ret }, endDate: { gt: pickup } },
      select: { vehicleId: true },
    }),
  ]);

  return [...new Set([...conflictingBookings.map((b) => b.vehicleId), ...conflictingBlocks.map((b) => b.vehicleId)])];
}

export async function isVehicleAvailable(vehicleId: string, pickup: Date, ret: Date): Promise<boolean> {
  const unavailable = await findUnavailableVehicleIds(pickup, ret);
  return !unavailable.includes(vehicleId);
}
