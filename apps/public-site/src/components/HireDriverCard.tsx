"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Languages, Star, UserRound } from "lucide-react";
import { driversApi, type Booking, type Driver } from "@vrm/api-client";
import { Badge, Button, Card, EmptyState, useToast } from "@vrm/ui";

/**
 * "Hire a driver" for an existing booking.
 *
 * Shown on the booking detail page rather than at checkout because a driver is
 * priced from the confirmed pickup/return window — quoting one before those are
 * locked in would mean re-quoting after every date change.
 */
export function HireDriverCard({ booking }: { booking: Booking }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);

  const cityId = booking.vehicle?.cityId;

  const { data: drivers, isLoading } = useQuery({
    queryKey: ["drivers", "available", booking.id],
    queryFn: () =>
      driversApi.available({
        cityId: cityId!,
        pickup: booking.pickupDatetime,
        returnAt: booking.returnDatetime,
      }),
    // Only fetch once the customer actually opens the picker — this is a
    // secondary action on the page, not something every visitor needs.
    enabled: expanded && Boolean(cityId),
  });

  const hire = useMutation({
    mutationFn: (driverId: string) => driversApi.hire(booking.id, driverId),
    onSuccess: () => {
      toast.success("Driver requested", "They'll confirm shortly — you'll be notified.");
      qc.invalidateQueries({ queryKey: ["bookings"] });
      setExpanded(false);
    },
    onError: (err) => toast.error("Could not request driver", err instanceof Error ? err.message : undefined),
  });

  // Already chauffeur-driven — show the state, not the picker.
  if (booking.withDriver) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600 dark:bg-accent-500/15">
            <UserRound size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-sm font-bold text-primary dark:text-white">Driver included</h3>
            <p className="text-xs text-primary-400">
              A chauffeur is attached to this booking · ₹{booking.driverFeeAmount}
            </p>
          </div>
          <Badge tone="success">With driver</Badge>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading font-semibold text-primary dark:text-white">Need a driver?</h3>
          <p className="mt-1 text-xs leading-relaxed text-primary-400">
            Add a verified chauffeur for this trip. Priced for your exact pickup and return times, and added to this
            booking&rsquo;s total.
          </p>
        </div>
        {!expanded && (
          <Button size="sm" variant="outline" onClick={() => setExpanded(true)}>
            Hire a driver
          </Button>
        )}
      </div>

      {expanded && (
        <div className="mt-4">
          {isLoading ? (
            <p className="text-sm text-primary-400">Finding drivers available for your dates…</p>
          ) : !drivers?.length ? (
            <EmptyState
              icon={<UserRound size={24} />}
              title="No drivers free for these dates"
              description="Every verified driver in this city is already booked for your window. Try adjusting your times."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {drivers.map((driver) => (
                <DriverOption
                  key={driver.id}
                  driver={driver}
                  isPending={hire.isPending}
                  onHire={() => hire.mutate(driver.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function DriverOption({
  driver,
  isPending,
  onHire,
}: {
  driver: Driver;
  isPending: boolean;
  onHire: () => void;
}) {
  const name = driver.user ? `${driver.user.firstName} ${driver.user.lastName}` : "Driver";

  return (
    <div className="flex flex-wrap items-start gap-4 rounded-xl border border-border p-4 dark:border-white/10">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary-50 font-heading text-sm font-bold text-secondary dark:bg-secondary-500/15 dark:text-accent-300">
        {name.charAt(0)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-heading text-sm font-bold text-primary dark:text-white">{name}</p>
          {driver.totalReviews > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {Number(driver.averageRating).toFixed(1)}
            </span>
          )}
        </div>

        <p className="mt-0.5 text-xs text-primary-400">
          {driver.yearsOfExperience} yrs experience · {driver.totalTrips} trips
        </p>

        {driver.languages && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-primary-400">
            <Languages size={12} /> {driver.languages}
          </p>
        )}

        {driver.bio && <p className="mt-2 text-xs leading-relaxed text-primary-500 dark:text-primary-200">{driver.bio}</p>}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {/* The quote is for this booking's exact window, not a day rate — so the
            customer sees the amount that will actually be added. */}
        <div className="text-right">
          <p className="font-heading text-base font-extrabold text-primary dark:text-white">
            ₹{driver.quotedAmount ?? driver.dailyRate}
          </p>
          <p className="text-[11px] text-primary-400">for this trip</p>
        </div>
        <Button size="sm" onClick={onHire} isLoading={isPending} className="gap-1.5">
          <Check size={14} /> Hire
        </Button>
      </div>
    </div>
  );
}
