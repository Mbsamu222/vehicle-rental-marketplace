"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { RefreshCcw } from "lucide-react";
import { useTransactions, useRefundPayment } from "@vrm/api-client";
import { Badge, Card, DataTable, Modal, PageTransition, Select, Button, Input, useToast } from "@vrm/ui";

/**
 * The backend's `GET /payments/transactions` returns rows from the `Transaction` model
 * (type, status, amount, paymentId, rentalPartnerId, reference, createdAt) — not `Payment` rows.
 * `@vrm/api-client`'s `useTransactions`/`paymentsApi.listTransactions` is typed as returning
 * `Payment[]`, which doesn't match the actual response shape (a pre-existing type gap in the
 * shared package that we were told not to modify). We define the real shape locally and cast.
 */
interface TransactionRow {
  id: string;
  type: "BOOKING_PAYMENT" | "REFUND" | "PAYOUT" | "WALLET_TOPUP" | "WALLET_DEBIT" | "COMMISSION";
  status: "PENDING" | "SUCCESS" | "FAILED";
  amount: string;
  paymentId?: string | null;
  rentalPartnerId?: string | null;
  reference?: string | null;
  createdAt: string;
}

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "BOOKING_PAYMENT", label: "Booking payment" },
  { value: "REFUND", label: "Refund" },
  { value: "PAYOUT", label: "Payout" },
  { value: "WALLET_TOPUP", label: "Wallet top-up" },
  { value: "WALLET_DEBIT", label: "Wallet debit" },
  { value: "COMMISSION", label: "Commission" },
];

const statusTone: Record<TransactionRow["status"], "warning" | "success" | "danger"> = {
  PENDING: "warning",
  SUCCESS: "success",
  FAILED: "danger",
};

export function TransactionsPage() {
  const [type, setType] = useState("");
  const { data, isLoading } = useTransactions({ type: type || undefined });
  const rows = (data?.data ?? []) as unknown as TransactionRow[];

  const refundPayment = useRefundPayment();
  const toast = useToast();
  const [refundTarget, setRefundTarget] = useState<TransactionRow | null>(null);
  const { register, handleSubmit, reset } = useForm<{ amount?: string; reason?: string }>();

  const onRefund = handleSubmit(async (values) => {
    if (!refundTarget?.paymentId) return;
    try {
      await refundPayment.mutateAsync({
        id: refundTarget.paymentId,
        amount: values.amount ? Number(values.amount) : undefined,
        reason: values.reason || undefined,
      });
      toast.success("Refund issued");
      setRefundTarget(null);
      reset();
    } catch (err) {
      toast.error("Refund failed", err instanceof Error ? err.message : undefined);
    }
  });

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Transactions</h1>
        <p className="text-sm text-primary-400">
          Every ledger movement across bookings, payouts, wallet activity, and commissions.
        </p>
      </div>

      <div className="mb-4 max-w-xs">
        <Select options={TYPE_OPTIONS} value={type} onChange={(e) => setType(e.target.value)} />
      </div>

      <Card>
        <div className="p-5">
          <DataTable
            isLoading={isLoading}
            data={rows}
            keyFor={(t) => t.id}
            emptyTitle="No transactions found"
            columns={[
              { header: "Date", cell: (t) => new Date(t.createdAt).toLocaleString() },
              { header: "Type", cell: (t) => t.type.replace(/_/g, " ") },
              { header: "Amount", cell: (t) => `₹${t.amount}` },
              { header: "Status", cell: (t) => <Badge tone={statusTone[t.status]}>{t.status}</Badge> },
              { header: "Reference", cell: (t) => t.reference ?? "—" },
              {
                header: "Actions",
                cell: (t) =>
                  t.paymentId ? (
                    <Button size="sm" variant="outline" onClick={() => setRefundTarget(t)}>
                      <RefreshCcw size={13} /> Refund
                    </Button>
                  ) : (
                    <span className="text-xs text-primary-300">No payment linked</span>
                  ),
              },
            ]}
          />
        </div>
      </Card>

      <Modal open={!!refundTarget} onClose={() => setRefundTarget(null)} title="Issue refund">
        <form onSubmit={onRefund} className="flex flex-col gap-4">
          <p className="text-sm text-primary-400">
            Refunding payment linked to transaction of ₹{refundTarget?.amount}. Leave amount blank for a full refund.
          </p>
          <Input label="Amount (optional)" type="number" step="0.01" {...register("amount")} />
          <Input label="Reason (optional)" {...register("reason")} />
          <Button type="submit" isLoading={refundPayment.isPending} fullWidth>
            Issue refund
          </Button>
        </form>
      </Modal>
    </PageTransition>
  );
}
