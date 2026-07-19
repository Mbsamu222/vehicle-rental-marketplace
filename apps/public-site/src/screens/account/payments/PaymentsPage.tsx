"use client";

import { Wallet as WalletIcon } from "lucide-react";
import { useMyPayments, useWallet } from "@vrm/api-client";
import { Card, DataTable, Badge, StatCard } from "@vrm/ui";

export function PaymentsPage() {
  const { data: payments, isLoading } = useMyPayments();
  const { data: wallet } = useWallet();

  return (
    <>
      <h1 className="mb-1 font-heading text-2xl font-bold">Payments & wallet</h1>
      <p className="mb-6 text-sm text-primary-400">Review your payment history and wallet balance.</p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Wallet balance" value={`₹${wallet?.balance ?? 0}`} icon={<WalletIcon size={20} />} tone="accent" />
        <StatCard label="Total payments" value={payments?.meta.total ?? 0} tone="secondary" />
      </div>

      <Card>
        <div className="p-5">
          <DataTable
            isLoading={isLoading}
            data={payments?.data ?? []}
            keyFor={(p) => p.id}
            emptyTitle="No payments yet"
            columns={[
              { header: "Date", cell: (p) => new Date(p.createdAt).toLocaleDateString() },
              { header: "Provider", cell: (p) => p.provider },
              { header: "Amount", cell: (p) => `₹${p.amount}` },
              {
                header: "Status",
                cell: (p) => (
                  <Badge tone={p.status === "PAID" ? "success" : p.status === "FAILED" ? "danger" : "warning"}>{p.status}</Badge>
                ),
              },
            ]}
          />
        </div>
      </Card>
    </>
  );
}
