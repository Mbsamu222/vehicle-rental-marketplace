"use client";

import { useState } from "react";
import { Link } from "@vrm/ui";
import { Building2 } from "lucide-react";
import { usePartners } from "@vrm/api-client";
import { Badge, Card, DataTable, PageTransition, Tabs } from "@vrm/ui";

const TABS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

const tone: Record<string, "warning" | "info" | "success" | "danger"> = {
  PENDING: "warning",
  UNDER_REVIEW: "info",
  VERIFIED: "success",
  REJECTED: "danger",
};

export function PartnersPage() {
  const [status, setStatus] = useState("");
  const { data, isLoading } = usePartners(status || undefined);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Rental partners</h1>
        <p className="text-sm text-primary-400">Review business profiles, KYC documents, and verification status.</p>
      </div>

      <Tabs tabs={TABS} value={status} onChange={setStatus} className="mb-6" />

      <Card>
        <div className="p-5">
          <DataTable
            isLoading={isLoading}
            data={data?.data ?? []}
            keyFor={(p) => p.id}
            emptyTitle="No rental partners found"
            emptyDescription="Partners will appear here once they complete onboarding."
            onRowClick={undefined}
            columns={[
              {
                header: "Business",
                cell: (p) => (
                  <Link to={`/partners/${p.id}`} className="flex items-center gap-2 font-semibold hover:underline">
                    <Building2 size={14} className="text-primary-300" /> {p.businessName}
                  </Link>
                ),
              },
              { header: "Email", cell: (p) => p.businessEmail },
              { header: "City", cell: (p) => p.city?.name ?? "—" },
              {
                header: "Verification",
                cell: (p) => <Badge tone={tone[p.verificationStatus]}>{p.verificationStatus.replace(/_/g, " ")}</Badge>,
              },
              { header: "Rating", cell: (p) => `${p.averageRating} (${p.totalReviews})` },
              {
                header: "",
                cell: (p) => (
                  <Link to={`/partners/${p.id}`} className="text-sm font-medium text-link hover:underline">
                    View
                  </Link>
                ),
              },
            ]}
          />
        </div>
      </Card>
    </PageTransition>
  );
}
