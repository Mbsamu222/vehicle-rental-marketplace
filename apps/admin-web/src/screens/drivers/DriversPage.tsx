"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IdCard, Star } from "lucide-react";
import { driversApi, type Driver, type DriverVerificationStatus } from "@vrm/api-client";
import { Badge, Button, Card, EmptyState, Modal, PageSpinner, PageTransition, Tabs, Textarea, useToast } from "@vrm/ui";

const STATUS_TONE: Record<DriverVerificationStatus, "warning" | "success" | "danger" | "neutral" | "info"> = {
  PENDING: "warning",
  UNDER_REVIEW: "info",
  VERIFIED: "success",
  REJECTED: "danger",
  SUSPENDED: "neutral",
};

const TABS: { value: string; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
  { value: "", label: "All" },
];

export function DriversPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState("PENDING");
  const [rejecting, setRejecting] = useState<Driver | null>(null);
  const [reason, setReason] = useState("");

  const { data: drivers, isLoading } = useQuery({
    queryKey: ["admin", "drivers", status],
    queryFn: () => driversApi.list(status || undefined),
  });

  const review = useMutation({
    mutationFn: ({ id, next, why }: { id: string; next: DriverVerificationStatus; why?: string }) =>
      driversApi.review(id, next, why),
    onSuccess: (_, vars) => {
      toast.success(`Driver ${vars.next.toLowerCase()}`);
      qc.invalidateQueries({ queryKey: ["admin", "drivers"] });
      setRejecting(null);
      setReason("");
    },
    onError: (err) => toast.error("Could not update", err instanceof Error ? err.message : undefined),
  });

  if (isLoading) return <PageSpinner />;
  const rows = drivers ?? [];

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Drivers</h1>
        <p className="text-sm text-primary-400">
          Verify chauffeurs before they can be hired. A driver carries passengers, so licence and identity checks
          gate every profile.
        </p>
      </div>

      <Tabs
        tabs={TABS}
        value={status}
        onChange={setStatus}
        className="mb-5"
      />

      {rows.length === 0 ? (
        <EmptyState icon={<IdCard size={26} />} title="No drivers in this state" />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((d) => (
            <Card key={d.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-base font-bold text-primary dark:text-white">
                      {d.user ? `${d.user.firstName} ${d.user.lastName}` : "Driver"}
                    </h3>
                    <Badge tone={STATUS_TONE[d.verificationStatus]}>{d.verificationStatus}</Badge>
                    {!d.isAvailable && <Badge tone="neutral">Unavailable</Badge>}
                  </div>

                  <p className="mt-1 text-xs text-primary-400">
                    {d.user?.email} · {d.city?.name} · Licence {d.licenseNumber} · expires{" "}
                    {new Date(d.licenseExpiry).toLocaleDateString()}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-primary-400">
                    <span>{d.yearsOfExperience} yrs experience</span>
                    <span>₹{d.dailyRate}/day · ₹{d.hourlyRate}/hr</span>
                    {d.totalReviews > 0 && (
                      <span className="flex items-center gap-1">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {Number(d.averageRating).toFixed(1)} ({d.totalReviews})
                      </span>
                    )}
                    <span>{d.totalTrips} trips</span>
                  </div>

                  {d.languages && <p className="mt-1 text-xs text-primary-400">Speaks {d.languages}</p>}
                  {d.bio && <p className="mt-2 text-sm text-primary-500 dark:text-primary-200">{d.bio}</p>}
                  {d.rejectionReason && (
                    <p className="mt-2 text-xs text-danger">Rejection reason: {d.rejectionReason}</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {d.verificationStatus !== "VERIFIED" && (
                    <Button
                      size="sm"
                      onClick={() => review.mutate({ id: d.id, next: "VERIFIED" })}
                      isLoading={review.isPending}
                    >
                      Verify
                    </Button>
                  )}
                  {d.verificationStatus === "PENDING" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => review.mutate({ id: d.id, next: "UNDER_REVIEW" })}
                    >
                      Mark reviewing
                    </Button>
                  )}
                  {d.verificationStatus !== "REJECTED" && (
                    <Button size="sm" variant="danger" onClick={() => setRejecting(d)}>
                      Reject
                    </Button>
                  )}
                  {d.verificationStatus === "VERIFIED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => review.mutate({ id: d.id, next: "SUSPENDED" })}
                    >
                      Suspend
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={rejecting !== null} onClose={() => setRejecting(null)} title="Reject driver">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-primary-400">
            The reason is shown to the driver so they can correct and resubmit.
          </p>
          <Textarea
            label="Reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Licence image unreadable — please re-upload a clear scan."
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={review.isPending}
              disabled={!reason.trim()}
              onClick={() => rejecting && review.mutate({ id: rejecting.id, next: "REJECTED", why: reason.trim() })}
            >
              Reject driver
            </Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
