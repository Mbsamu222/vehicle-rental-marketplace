"use client";

import { useState } from "react";
import { Car, Check, X } from "lucide-react";
import { usePendingVehicles, useReviewVehicle } from "@vrm/api-client";
import { Badge, Button, Card, EmptyState, Modal, PageTransition, SkeletonCard, Textarea, useToast } from "@vrm/ui";

export function VehicleApprovalsPage() {
  const { data, isLoading } = usePendingVehicles();
  const reviewVehicle = useReviewVehicle();
  const toast = useToast();
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const onApprove = async (id: string) => {
    try {
      await reviewVehicle.mutateAsync({ id, status: "APPROVED" });
      toast.success("Vehicle approved");
    } catch (err) {
      toast.error("Could not approve vehicle", err instanceof Error ? err.message : undefined);
    }
  };

  const onReject = async () => {
    if (!rejectModal || !rejectionReason.trim()) {
      toast.error("A rejection reason is required");
      return;
    }
    try {
      await reviewVehicle.mutateAsync({ id: rejectModal.id, status: "REJECTED", rejectionReason });
      toast.success("Vehicle rejected");
      setRejectModal(null);
      setRejectionReason("");
    } catch (err) {
      toast.error("Could not reject vehicle", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Vehicle approvals</h1>
        <p className="text-sm text-primary-400">
          New vehicle listings wait here until approved. There is no platform-wide vehicle browser beyond this
          pending queue — approved vehicles are managed by their rental partner.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !data?.data.length ? (
        <EmptyState icon={<Car size={26} />} title="No vehicles pending approval" description="New listings will show up here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.data.map((vehicle) => (
            <Card key={vehicle.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start gap-3">
                <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-primary-50 dark:bg-white/5">
                  {vehicle.images?.[0] && <img src={vehicle.images[0].url} alt="" className="size-full object-cover" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">
                    {vehicle.year} {vehicle.model}
                  </p>
                  <p className="text-xs text-primary-400">{vehicle.registrationNumber}</p>
                  <p className="text-xs text-primary-400">
                    Partner: {vehicle.rentalPartner?.businessName ?? "—"}
                  </p>
                </div>
                <Badge tone="warning">PENDING</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-primary-400">
                <span>{vehicle.transmission}</span>
                <span>{vehicle.fuelType}</span>
                <span>{vehicle.seatingCapacity} seats</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-heading font-semibold">₹{vehicle.pricePerDay}/day</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onApprove(vehicle.id)} isLoading={reviewVehicle.isPending}>
                    <Check size={14} /> Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setRejectModal({ id: vehicle.id })}>
                    <X size={14} /> Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject vehicle listing">
        <div className="flex flex-col gap-4">
          <Textarea
            label="Rejection reason"
            required
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain why this listing is being rejected…"
          />
          <Button variant="danger" onClick={onReject} isLoading={reviewVehicle.isPending} fullWidth>
            Reject listing
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}
