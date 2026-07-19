"use client";

import { useState } from "react";
import { Link } from "@vrm/ui";
import { CalendarX } from "lucide-react";
import { useMyBookings } from "@vrm/api-client";
import type { BookingStatus } from "@vrm/api-client";
import { Card, Tabs, EmptyState, SkeletonCard, BookingStatusBadge } from "@vrm/ui";

const TABS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function MyBookingsPage() {
  const [status, setStatus] = useState("");
  const { data, isLoading } = useMyBookings((status || undefined) as BookingStatus | undefined);

  return (
    <>
      <h1 className="mb-1 font-heading text-2xl font-bold">My bookings</h1>
      <p className="mb-6 text-sm text-primary-400">Track and manage all your vehicle rentals.</p>

      <Tabs tabs={TABS} value={status} onChange={setStatus} className="mb-6" />

      {isLoading ? (
        <div className="grid gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !data?.data.length ? (
        <EmptyState icon={<CalendarX size={26} />} title="No bookings found" description="Your bookings will appear here." />
      ) : (
        <div className="grid gap-4">
          {data.data.map((booking) => (
            <Link key={booking.id} to={`/account/bookings/${booking.id}`}>
              <Card hoverable className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-primary-50 dark:bg-white/5">
                    {booking.vehicle?.images?.[0] && (
                      <img src={booking.vehicle.images[0].url} alt="" className="size-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{booking.vehicle?.model}</p>
                    <p className="text-xs text-primary-400">{booking.bookingNumber}</p>
                    <p className="text-xs text-primary-400">
                      {new Date(booking.pickupDatetime).toLocaleDateString()} → {new Date(booking.returnDatetime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-heading font-semibold">₹{booking.totalAmount}</p>
                  <BookingStatusBadge status={booking.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
