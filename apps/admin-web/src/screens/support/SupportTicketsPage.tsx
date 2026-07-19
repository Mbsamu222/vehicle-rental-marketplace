"use client";

import { useState } from "react";
import { Link } from "@vrm/ui";
import { LifeBuoy } from "lucide-react";
import { useAllTickets } from "@vrm/api-client";
import { Badge, Card, EmptyState, PageTransition, SkeletonCard, Tabs } from "@vrm/ui";

const TABS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const tone: Record<string, "warning" | "info" | "success" | "neutral"> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  CLOSED: "neutral",
};

export function SupportTicketsPage() {
  const [status, setStatus] = useState("");
  const { data, isLoading } = useAllTickets(status || undefined);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Support tickets</h1>
        <p className="text-sm text-primary-400">Respond to customer and partner support requests.</p>
      </div>

      <Tabs tabs={TABS} value={status} onChange={setStatus} className="mb-6" />

      {isLoading ? (
        <div className="grid gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !data?.data.length ? (
        <EmptyState icon={<LifeBuoy size={26} />} title="No tickets found" description="Nothing matches this filter." />
      ) : (
        <div className="flex flex-col gap-3">
          {data.data.map((ticket) => (
            <Link key={ticket.id} to={`/support/${ticket.id}`}>
              <Card hoverable className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{ticket.subject}</p>
                  <p className="text-xs text-primary-400">Updated {new Date(ticket.updatedAt).toLocaleString()}</p>
                </div>
                <Badge tone={tone[ticket.status]}>{ticket.status.replace(/_/g, " ")}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
