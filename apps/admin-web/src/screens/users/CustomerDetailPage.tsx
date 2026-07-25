"use client";

import { useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { Link } from "@vrm/ui";
import { ArrowLeft, Mail, Phone, Receipt } from "lucide-react";
import { useAdminUser, useTransactions } from "@vrm/api-client";
import type { AccountStatus } from "@vrm/api-client";
import { Badge, Card, DataTable, PageSpinner, PageTransition, Modal } from "@vrm/ui";

/**
 * `GET /payments/transactions` returns rows from the `Transaction` model (type, status, amount,
 * paymentId, rentalPartnerId, reference, createdAt) — not `Payment` rows. `@vrm/api-client`'s
 * `useTransactions`/`paymentsApi.listTransactions` is typed as returning `Payment[]`, which
 * doesn't match the actual response shape (see TransactionsPage.tsx for the same workaround).
 */
interface TransactionRow {
  id: string;
  type: "BOOKING_PAYMENT" | "REFUND" | "PAYOUT" | "WALLET_TOPUP" | "WALLET_DEBIT" | "COMMISSION";
  status: "PENDING" | "SUCCESS" | "FAILED";
  amount: string;
  paymentId?: string | null;
  walletId?: string | null;
  rentalPartnerId?: string | null;
  reference?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

const statusTone: Record<TransactionRow["status"], "warning" | "success" | "danger"> = {
  PENDING: "warning",
  SUCCESS: "success",
  FAILED: "danger",
};

const accountStatusTone: Record<AccountStatus, "warning" | "success" | "danger" | "neutral"> = {
  PENDING_VERIFICATION: "warning",
  ACTIVE: "success",
  SUSPENDED: "danger",
  BANNED: "danger",
};

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading } = useAdminUser(id);
  const { data: transactionsData, isLoading: isLoadingTransactions } = useTransactions({ customerId: id });
  const rows = (transactionsData?.data ?? []) as unknown as TransactionRow[];

  const [selected, setSelected] = useState<TransactionRow | null>(null);

  if (isLoading || !customer) return <PageSpinner />;

  return (
    <PageTransition>
      <Link to="/users" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-link hover:underline">
        <ArrowLeft size={15} /> Back to users
      </Link>

      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="text-sm text-primary-400">Customer since {new Date(customer.createdAt).toLocaleDateString()}</p>
        </div>
        <Badge tone={accountStatusTone[customer.accountStatus]}>{customer.accountStatus.replace(/_/g, " ")}</Badge>
      </div>

      <Card className="mb-6 p-5">
        <h2 className="mb-4 font-heading text-lg font-semibold">Profile</h2>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 text-primary-500 dark:text-primary-200">
            <Mail size={14} /> {customer.email}
          </div>
          <div className="flex items-center gap-2 text-primary-500 dark:text-primary-200">
            <Phone size={14} /> {customer.phone ?? "—"}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold">
            <Receipt size={18} /> Transactions
          </h2>
          <DataTable
            isLoading={isLoadingTransactions}
            data={rows}
            keyFor={(t) => t.id}
            emptyTitle="No transactions found"
            emptyDescription="This customer hasn't made any payments, refunds, or wallet activity yet."
            onRowClick={(t) => setSelected(t)}
            columns={[
              { header: "Date", cell: (t) => new Date(t.createdAt).toLocaleString() },
              { header: "Type", cell: (t) => t.type.replace(/_/g, " ") },
              { header: "Amount", cell: (t) => `₹${t.amount}` },
              { header: "Status", cell: (t) => <Badge tone={statusTone[t.status]}>{t.status}</Badge> },
              { header: "Reference", cell: (t) => t.reference ?? "—" },
            ]}
          />
        </div>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Transaction details">
        {selected && (
          <div className="flex flex-col gap-3 text-sm">
            <Row label="Transaction ID" value={selected.id} />
            <Row label="Type" value={selected.type.replace(/_/g, " ")} />
            <Row label="Status" value={<Badge tone={statusTone[selected.status]}>{selected.status}</Badge>} />
            <Row label="Amount" value={`₹${selected.amount}`} />
            <Row label="Payment ID" value={selected.paymentId ?? "—"} />
            <Row label="Wallet ID" value={selected.walletId ?? "—"} />
            <Row label="Reference" value={selected.reference ?? "—"} />
            <Row label="Date" value={new Date(selected.createdAt).toLocaleString()} />
            {selected.metadata && Object.keys(selected.metadata).length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold text-primary-400">Metadata</p>
                <pre className="overflow-x-auto rounded-lg bg-primary-50 p-3 text-xs dark:bg-white/5">
                  {JSON.stringify(selected.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-2 last:border-0 dark:border-dark-border">
      <span className="text-xs font-semibold text-primary-400">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
