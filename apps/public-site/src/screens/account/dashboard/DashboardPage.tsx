"use client";

import { Link } from "@vrm/ui";
import { CalendarCheck, CheckCircle2, Heart, Wallet, Search, ArrowRight } from "lucide-react";
import { useAuth, useCustomerDashboard, useMyBookings } from "@vrm/api-client";
import { Button, Card, StatCard, BookingStatusBadge, EmptyState, SkeletonCard } from "@vrm/ui";

export function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useCustomerDashboard();
  const { data: recentBookings } = useMyBookings();

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold">Welcome back, {user?.firstName}</h1>
          <p className="text-sm text-primary-400">Here's what's happening with your bookings.</p>
        </div>
        <Link to="/search">
          <Button>
            <Search size={16} /> Find a vehicle
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Active bookings" value={stats?.activeBookings ?? 0} icon={<CalendarCheck size={20} />} tone="secondary" />
          <StatCard label="Completed trips" value={stats?.completedBookings ?? 0} icon={<CheckCircle2 size={20} />} tone="success" />
          <StatCard label="Wishlist" value={stats?.wishlistCount ?? 0} icon={<Heart size={20} />} tone="danger" />
          <StatCard label="Wallet balance" value={`₹${stats?.walletBalance ?? 0}`} icon={<Wallet size={20} />} tone="accent" />
        </div>
      )}

      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-border p-5 dark:border-dark-border">
          <h2 className="font-heading text-lg font-semibold">Recent bookings</h2>
          <Link to="/account/bookings" className="flex items-center gap-1 text-sm font-medium text-link hover:underline">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="p-5">
          {!recentBookings?.data.length ? (
            <EmptyState
              title="No bookings yet"
              description="Once you book a vehicle, it'll show up here."
              action={
                <Link to="/search">
                  <Button size="sm">Browse vehicles</Button>
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col divide-y divide-border dark:divide-dark-border">
              {recentBookings.data.slice(0, 5).map((booking) => (
                <Link
                  key={booking.id}
                  to={`/account/bookings/${booking.id}`}
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
    </div>
  );
}
