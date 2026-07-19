"use client";

import { useState } from "react";
import { IdCard, Check, X } from "lucide-react";
import { useAdminDrivingLicenses, useReviewDrivingLicense } from "@vrm/api-client";
import type { DrivingLicenseStatus } from "@vrm/api-client";
import { Badge, Button, Card, EmptyState, Modal, PageTransition, SkeletonCard, Tabs, Textarea, useToast } from "@vrm/ui";

const TABS: { value: DrivingLicenseStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

const tone: Record<DrivingLicenseStatus, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  VERIFIED: "success",
  REJECTED: "danger",
};

export function DrivingLicensesPage() {
  const [status, setStatus] = useState<DrivingLicenseStatus>("PENDING");
  const { data, isLoading } = useAdminDrivingLicenses(status);
  const reviewLicense = useReviewDrivingLicense();
  const toast = useToast();
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const onApprove = async (id: string) => {
    try {
      await reviewLicense.mutateAsync({ id, status: "VERIFIED" });
      toast.success("License verified");
    } catch (err) {
      toast.error("Could not verify license", err instanceof Error ? err.message : undefined);
    }
  };

  const onReject = async () => {
    if (!rejectModal) return;
    try {
      await reviewLicense.mutateAsync({ id: rejectModal.id, status: "REJECTED", rejectionReason: rejectionReason || undefined });
      toast.success("License rejected");
      setRejectModal(null);
      setRejectionReason("");
    } catch (err) {
      toast.error("Could not reject license", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Driving license review</h1>
        <p className="text-sm text-primary-400">
          A license must be verified here before its owner can complete any booking on the platform — this is the
          only place that ever happens.
        </p>
      </div>

      <Tabs tabs={TABS} value={status} onChange={(v) => setStatus(v as DrivingLicenseStatus)} className="mb-6" />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !data?.data.length ? (
        <EmptyState icon={<IdCard size={26} />} title="No licenses here" description="Nothing matches this filter right now." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.data.map((license) => (
            <Card key={license.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">
                    {license.user ? `${license.user.firstName} ${license.user.lastName}` : "Unknown applicant"}
                  </p>
                  <p className="text-xs text-primary-400">{license.user?.email ?? "—"}</p>
                </div>
                <Badge tone={tone[license.status]}>{license.status}</Badge>
              </div>
              <div className="text-sm">
                <p>License no. {license.licenseNumber}</p>
                <p className="text-xs text-primary-400">Expires {new Date(license.expiryDate).toLocaleDateString()}</p>
                {license.rejectionReason && <p className="mt-1 text-xs text-danger">{license.rejectionReason}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a href={license.frontImageUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-border dark:border-dark-border">
                  <img src={license.frontImageUrl} alt="License front" className="h-28 w-full object-cover" />
                </a>
                {license.backImageUrl ? (
                  <a href={license.backImageUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-border dark:border-dark-border">
                    <img src={license.backImageUrl} alt="License back" className="h-28 w-full object-cover" />
                  </a>
                ) : (
                  <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border text-xs text-primary-300 dark:border-dark-border">
                    No back image
                  </div>
                )}
              </div>
              {license.status === "PENDING" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => onApprove(license.id)} isLoading={reviewLicense.isPending}>
                    <Check size={14} /> Approve
                  </Button>
                  <Button size="sm" variant="danger" className="flex-1" onClick={() => setRejectModal({ id: license.id })}>
                    <X size={14} /> Reject
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject driving license">
        <div className="flex flex-col gap-4">
          <Textarea
            label="Rejection reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain why this license is being rejected…"
          />
          <Button variant="danger" onClick={onReject} isLoading={reviewLicense.isPending} fullWidth>
            Reject license
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}
