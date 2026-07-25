"use client";

import { Link } from "@vrm/ui";
import {
  Users,
  Building2,
  ShieldCheck,
  CarFront,
  Clock,
  CalendarCheck,
  Activity,
  IndianRupee,
  LifeBuoy,
  ArrowRight,
} from "lucide-react";
import { useAuth, useAdminDashboard } from "@vrm/api-client";
import { Card, PageTransition, StatCard, SkeletonCard } from "@vrm/ui";

export function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useAdminDashboard();

  return (
    <PageTransition>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-black text-primary dark:text-white sm:text-3xl">
          Platform Overview & Control
        </h1>
        <p className="mt-1 text-xs font-medium text-primary-400">
          Real-time snapshot of registered customers, rental partners, vehicles, and active trips.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <StatCard label="Total customers" value={stats?.totalCustomers ?? 0} icon={<Users size={22} />} tone="secondary" />
          <StatCard label="Rental partners" value={stats?.totalPartners ?? 0} icon={<Building2 size={22} />} tone="primary" />
          <StatCard label="Verified partners" value={stats?.verifiedPartners ?? 0} icon={<ShieldCheck size={22} />} tone="success" />
          <StatCard label="Total vehicles" value={stats?.totalVehicles ?? 0} icon={<CarFront size={22} />} tone="accent" />
          <StatCard
            label="Pending vehicle approvals"
            value={stats?.pendingVehicleApprovals ?? 0}
            icon={<Clock size={22} />}
            tone="warning"
          />
          <StatCard label="Total bookings" value={stats?.totalBookings ?? 0} icon={<CalendarCheck size={22} />} tone="secondary" />
          <StatCard label="Active bookings" value={stats?.activeBookings ?? 0} icon={<Activity size={22} />} tone="accent" />
          <StatCard label="Total booking value (GMV)" value={`₹${stats?.totalBookingValue ?? 0}`} icon={<IndianRupee size={22} />} tone="secondary" />
          <StatCard label="Platform revenue (earned)" value={`₹${stats?.totalRevenue ?? 0}`} icon={<IndianRupee size={22} />} tone="success" />
        </div>
      )}

      <Card className="mt-8 shadow-soft border border-border">
        <div className="flex items-center justify-between border-b border-border/60 p-5 dark:border-white/10">
          <div>
            <h2 className="font-heading text-lg font-bold text-primary dark:text-white">Pending Support Tickets</h2>
            <p className="mt-0.5 text-xs text-primary-400">
              {stats?.pendingSupportTickets ?? 0} ticket{stats?.pendingSupportTickets === 1 ? "" : "s"} awaiting administrative response.
            </p>
          </div>
          <Link to="/support" className="flex items-center gap-1.5 text-xs font-bold text-secondary hover:underline dark:text-accent-300">
            <LifeBuoy size={15} /> View Tickets <ArrowRight size={14} />
          </Link>
        </div>
        <div className="p-5 text-xs text-primary-400 leading-relaxed">
          Admin oversight allows full control over partner verifications, vehicle approvals, driving license validations, user roles, and platform settings.
        </div>
      </Card>
    </PageTransition>
  );
}
