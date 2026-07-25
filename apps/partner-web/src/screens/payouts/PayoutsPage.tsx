"use client";

import { Wallet } from "lucide-react";
import { usePartnerPayouts } from "@vrm/api-client";
import { Badge, Card, DataTable, PageTransition } from "@vrm/ui";

const statusTone: Record<string, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  SUCCESS: "success",
  FAILED: "danger",
};

export function PayoutsPage() {
  const { data, isLoading } = usePartnerPayouts();

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Payouts</h1>
        <p className="text-sm text-primary-400">
          Settlements from your completed bookings, net of platform commission (and the payout fee, if enabled).
          Triggered by the RentWheels team.
        </p>
      </div>

      <Card>
        <div className="p-5">
          <DataTable
            isLoading={isLoading}
            data={data?.data ?? []}
            keyFor={(p) => p.id}
            emptyTitle="No payouts yet"
            emptyDescription="Once you have completed bookings, the RentWheels team will settle your earnings here."
            columns={[
              { header: "Date", cell: (p) => new Date(p.createdAt).toLocaleString() },
              { header: "Amount", cell: (p) => <span className="font-semibold">₹{p.amount}</span> },
              {
                header: "Bookings included",
                cell: (p) => (p.metadata?.bookingCount as number | undefined) ?? "—",
              },
              { header: "Status", cell: (p) => <Badge tone={statusTone[p.status] ?? "warning"}>{p.status}</Badge> },
            ]}
          />
        </div>
      </Card>

      <Card className="mt-6 flex items-start gap-3 p-5">
        <Wallet size={18} className="mt-0.5 shrink-0 text-secondary" />
        <p className="text-xs text-primary-400 leading-relaxed">
          Payout amounts reflect the platform commission rate on your account and, once enabled, a payout/settlement
          fee. Both are separate from what customers pay at checkout (which includes taxes and refundable security
          deposits that are never part of a payout).
        </p>
      </Card>
    </PageTransition>
  );
}
