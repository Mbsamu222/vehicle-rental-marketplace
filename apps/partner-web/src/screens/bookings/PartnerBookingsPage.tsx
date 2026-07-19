"use client";

import { useState } from "react";
import { Link } from "@vrm/ui";
import { CalendarX } from "lucide-react";
import { usePartnerBookings } from "@vrm/api-client";
import type { BookingStatus } from "@vrm/api-client";
import { Card, Tabs, EmptyState, SkeletonCard, BookingStatusBadge, PageTransition } from "@vrm/ui";

const TABS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "APPROVED", label: "Approved" },
  { value: "VEHICLE_READY", label: "Vehicle ready" },
  { value: "PICKED_UP", label: "Picked up" },
  { value: "ACTIVE", label: "Active" },
  { value: "RETURNING", label: "Returning" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function PartnerBookingsPage() {
  const [status, setStatus] = useState("");
  const { data, isLoading } = usePartnerBookings((status || undefined) as BookingStatus | undefined);

  return (
    <PageTransition>
      <h1 className="mb-1 font-heading text-2xl font-bold">Bookings</h1>
      <p className="mb-6 text-sm text-primary-400">Manage booking requests for your vehicles.</p>

      <Tabs tabs={TABS} value={status} onChange={setStatus} className="mb-6" />

      {isLoading ? (
        <div className="grid gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !data?.data.length ? (
        <EmptyState icon={<CalendarX size={26} />} title="No bookings found" description="Booking requests will appear here." />
      ) : (
        <div className="grid gap-4">
          {data.data.map((booking) => (
            <Link key={booking.id} to={`/bookings/${booking.id}`}>
              <Card hoverable className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{booking.vehicle?.model}</p>
                  <p className="text-xs text-primary-400">
                    {booking.customer?.firstName} {booking.customer?.lastName} · {booking.bookingNumber}
                  </p>
                  <p className="text-xs text-primary-400">
                    {new Date(booking.pickupDatetime).toLocaleDateString()} → {new Date(booking.returnDatetime).toLocaleDateString()}
                  </p>
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
    </PageTransition>
  );
}
