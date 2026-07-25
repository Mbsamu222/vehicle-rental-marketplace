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
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-black text-primary dark:text-white sm:text-3xl">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="mt-1 text-xs font-medium text-primary-400">
            Here is your live rental fleet performance and booking requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stats && (
            <Badge tone={VERIFICATION_TONE[stats.verificationStatus] ?? "neutral"}>
              {stats.verificationStatus.replace(/_/g, " ")}
            </Badge>
          )}
          <Link to="/vehicles">
            <Button size="sm" className="gap-2 text-xs font-bold">
              <Plus size={15} /> Add / Manage Vehicles
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
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <StatCard label="Total vehicles" value={stats?.totalVehicles ?? 0} icon={<Car size={22} />} tone="secondary" />
          <StatCard label="Active bookings" value={stats?.activeBookings ?? 0} icon={<CalendarCheck size={22} />} tone="accent" />
          <StatCard label="Pending requests" value={stats?.pendingRequests ?? 0} icon={<CalendarClock size={22} />} tone="warning" />
          <StatCard label="Completed trips" value={stats?.completedBookings ?? 0} icon={<CheckCircle2 size={22} />} tone="success" />
          <StatCard label="Total revenue" value={`₹${stats?.totalRevenue ?? 0}`} icon={<Wallet size={22} />} tone="primary" />
          <StatCard
            label="Average rating"
            value={stats?.averageRating ? Number(stats.averageRating).toFixed(1) : "—"}
            icon={<Star size={22} />}
            tone="accent"
          />
        </div>
      )}

      <Card className="mt-8 shadow-soft border border-border">
        <div className="flex items-center justify-between border-b border-border/60 p-5 dark:border-white/10">
          <div>
            <h2 className="font-heading text-lg font-bold text-primary dark:text-white">Recent Booking Requests</h2>
            <p className="text-xs text-primary-400">Incoming requests needing your approval or key handovers.</p>
          </div>
          <Link to="/bookings" className="flex items-center gap-1 text-xs font-bold text-secondary hover:underline dark:text-accent-300">
            View All Bookings <ArrowRight size={14} />
          </Link>
        </div>
        <div className="p-5">
          {!recentBookings?.data.length ? (
            <EmptyState
              title="No bookings yet"
              description="Once customers book your vehicles, incoming requests will show up here."
            />
          ) : (
            <div className="flex flex-col divide-y divide-border/60 dark:divide-white/10">
              {recentBookings.data.slice(0, 5).map((booking) => (
                <Link
                  key={booking.id}
                  to={`/bookings/${booking.id}`}
                  className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-primary-50/50 px-3 rounded-xl dark:hover:bg-white/5 first:pt-2 last:pb-2"
                >
                  <div>
                    <p className="font-heading text-sm font-bold text-primary dark:text-white">{booking.vehicle?.model ?? "Vehicle"}</p>
                    <p className="mt-0.5 text-xs text-primary-400">
                      {new Date(booking.pickupDatetime).toLocaleDateString()} — <span className="font-mono text-xs">{booking.bookingNumber}</span>
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
