"use client";

import { Link } from "@vrm/ui";
import { Car, CalendarClock, CalendarCheck, CheckCircle2, Wallet, Star, ArrowRight, Plus } from "lucide-react";
import { useAuth, usePartnerDashboard, usePartnerBookings } from "@vrm/api-client";
import { Button, Card, PageTransition, StatCard, BookingStatusBadge, Badge, EmptyState, SkeletonCard } from "@vrm/ui";

const VERIFICATION_TONE: Record<string, "warning" | "info" | "success" | "danger"> = {
  PENDING: "warning",
  UNDER_REVIEW: "info",
  VERIFIED: "success",
  REJECTED: "danger",
};

export function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = usePartnerDashboard();
  const { data: recentBookings } = usePartnerBookings();

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold">Welcome back, {user?.firstName}</h1>
          <p className="text-sm text-primary-400">Here's how your fleet is performing.</p>
        </div>
        <div className="flex items-center gap-3">
          {stats && (
            <Badge tone={VERIFICATION_TONE[stats.verificationStatus] ?? "neutral"}>
              {stats.verificationStatus.replace(/_/g, " ")}
            </Badge>
          )}
          <Link to="/vehicles">
            <Button>
              <Plus size={16} /> Manage vehicles
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total vehicles" value={stats?.totalVehicles ?? 0} icon={<Car size={20} />} tone="secondary" />
          <StatCard label="Active bookings" value={stats?.activeBookings ?? 0} icon={<CalendarCheck size={20} />} tone="accent" />
          <StatCard label="Pending requests" value={stats?.pendingRequests ?? 0} icon={<CalendarClock size={20} />} tone="warning" />
          <StatCard label="Completed trips" value={stats?.completedBookings ?? 0} icon={<CheckCircle2 size={20} />} tone="success" />
          <StatCard label="Total revenue" value={`₹${stats?.totalRevenue ?? 0}`} icon={<Wallet size={20} />} tone="primary" />
          <StatCard
            label="Average rating"
            value={stats?.averageRating ? Number(stats.averageRating).toFixed(1) : "—"}
            icon={<Star size={20} />}
            tone="accent"
          />
        </div>
      )}

      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-border p-5 dark:border-dark-border">
          <h2 className="font-heading text-lg font-semibold">Recent booking requests</h2>
          <Link to="/bookings" className="flex items-center gap-1 text-sm font-medium text-link hover:underline">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="p-5">
          {!recentBookings?.data.length ? (
            <EmptyState
              title="No bookings yet"
              description="Once customers book your vehicles, requests will show up here."
            />
          ) : (
            <div className="flex flex-col divide-y divide-border dark:divide-dark-border">
              {recentBookings.data.slice(0, 5).map((booking) => (
                <Link
                  key={booking.id}
                  to={`/bookings/${booking.id}`}
                  className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-semibold">{booking.vehicle?.model ?? "Vehicle"}</p>
                    <p className="text-xs text-primary-400">
                      {new Date(booking.pickupDatetime).toLocaleDateString()} — {booking.bookingNumber}
                    </p>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </Card>
    </PageTransition>
  );
}
