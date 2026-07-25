"use client";

import { Gauge, IndianRupee, Car, Lock } from "lucide-react";
import { usePartnerAnalytics } from "@vrm/api-client";
import { Card, EmptyState, PageSpinner, PageTransition, StatCard } from "@vrm/ui";

function Bar({ label, value, maxValue, valueLabel }: { label: string; value: number; maxValue: number; valueLabel: string }) {
  const pct = maxValue > 0 ? Math.max(4, Math.round((value / maxValue) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="truncate font-medium text-primary dark:text-white">{label}</span>
        <span className="shrink-0 text-xs font-semibold text-primary-400">{valueLabel}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-primary-50 dark:bg-white/5">
        <div className="h-full rounded-full bg-secondary transition-all dark:bg-accent-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function FleetAnalyticsPage() {
  const { data, isLoading, error } = usePartnerAnalytics();

  if (isLoading) return <PageSpinner />;

  if (error) {
    return (
      <PageTransition>
        <EmptyState
          icon={<Lock size={26} />}
          title="Fleet analytics isn't available on your plan yet"
          description="This is a paid add-on unlocked by certain subscription tiers. Check the Subscription page to see which plans include it, or contact us to enable it."
        />
      </PageTransition>
    );
  }

  if (!data) return null;

  const maxVehicleRevenue = Math.max(1, ...data.topVehicles.map((v) => Number(v.totalRevenue)));
  const maxCategoryCount = Math.max(1, ...data.categoryDemand.map((c) => c.bookingCount));

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Fleet analytics</h1>
        <p className="text-sm text-primary-400">Utilization and demand insights across your active fleet, last 30 days.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard label="Active vehicles" value={data.vehicleCount} icon={<Car size={22} />} tone="primary" />
        <StatCard label="Utilization (30d)" value={`${data.utilizationPercent}%`} icon={<Gauge size={22} />} tone="secondary" />
        <StatCard
          label="Avg. revenue / vehicle"
          value={`₹${data.averageRevenuePerVehicle}`}
          icon={<IndianRupee size={22} />}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-heading font-semibold">Top vehicles by revenue</h3>
          {!data.topVehicles.length ? (
            <p className="text-sm text-primary-400">No completed bookings yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {data.topVehicles.map((v) => (
                <Bar key={v.vehicleId} label={v.model} value={Number(v.totalRevenue)} maxValue={maxVehicleRevenue} valueLabel={`₹${v.totalRevenue}`} />
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-heading font-semibold">Demand by category (30d)</h3>
          {!data.categoryDemand.length ? (
            <p className="text-sm text-primary-400">No bookings in the last 30 days.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {data.categoryDemand.map((c) => (
                <Bar
                  key={c.categoryName}
                  label={c.categoryName}
                  value={c.bookingCount}
                  maxValue={maxCategoryCount}
                  valueLabel={`${c.bookingCount} booking${c.bookingCount === 1 ? "" : "s"}`}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
