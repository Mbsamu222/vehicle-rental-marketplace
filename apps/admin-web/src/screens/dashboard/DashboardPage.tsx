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
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Welcome back, {user?.firstName}</h1>
        <p className="text-sm text-primary-400">Platform-wide snapshot of customers, partners, and bookings.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total customers" value={stats?.totalCustomers ?? 0} icon={<Users size={20} />} tone="secondary" />
          <StatCard label="Rental partners" value={stats?.totalPartners ?? 0} icon={<Building2 size={20} />} tone="primary" />
          <StatCard label="Verified partners" value={stats?.verifiedPartners ?? 0} icon={<ShieldCheck size={20} />} tone="success" />
          <StatCard label="Total vehicles" value={stats?.totalVehicles ?? 0} icon={<CarFront size={20} />} tone="accent" />
          <StatCard
            label="Pending vehicle approvals"
            value={stats?.pendingVehicleApprovals ?? 0}
            icon={<Clock size={20} />}
            tone="warning"
          />
          <StatCard label="Total bookings" value={stats?.totalBookings ?? 0} icon={<CalendarCheck size={20} />} tone="secondary" />
          <StatCard label="Active bookings" value={stats?.activeBookings ?? 0} icon={<Activity size={20} />} tone="accent" />
          <StatCard label="Total revenue" value={`₹${stats?.totalRevenue ?? 0}`} icon={<IndianRupee size={20} />} tone="success" />
        </div>
      )}

      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-border p-5 dark:border-dark-border">
          <div>
            <h2 className="font-heading text-lg font-semibold">Pending support tickets</h2>
            <p className="text-sm text-primary-400">
              {stats?.pendingSupportTickets ?? 0} ticket{stats?.pendingSupportTickets === 1 ? "" : "s"} awaiting a response.
            </p>
          </div>
          <Link to="/support" className="flex items-center gap-1 text-sm font-medium text-link hover:underline">
            <LifeBuoy size={15} /> View tickets <ArrowRight size={14} />
          </Link>
        </div>
        <div className="p-5 text-sm text-primary-400">
          The backend does not expose a platform-wide list of every booking or vehicle — this dashboard's aggregate
          counts plus the Vehicle Approvals queue are the extent of admin booking/vehicle oversight available today.
        </div>
      </Card>
    </PageTransition>
  );
}
