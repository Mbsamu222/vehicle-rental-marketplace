"use client";

import { useState } from "react";
import { useAuditLogs } from "@vrm/api-client";
import { Card, DataTable, Input, PageTransition } from "@vrm/ui";

export function AuditLogsPage() {
  const [entityType, setEntityType] = useState("");
  const { data, isLoading } = useAuditLogs(entityType || undefined);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Audit logs</h1>
        <p className="text-sm text-primary-400">Read-only trail of administrative and system actions.</p>
      </div>

      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Filter by entity type (e.g. Vehicle)"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        />
      </div>

      <Card>
        <div className="p-5">
          <DataTable
            isLoading={isLoading}
            data={data?.data ?? []}
            keyFor={(l) => l.id}
            emptyTitle="No audit log entries"
            columns={[
              { header: "Date", cell: (l) => new Date(l.createdAt).toLocaleString() },
              { header: "Action", cell: (l) => l.action },
              { header: "Entity", cell: (l) => `${l.entityType}${l.entityId ? ` #${l.entityId.slice(0, 8)}` : ""}` },
              {
                header: "User",
                cell: (l) => (l.user ? `${l.user.firstName} ${l.user.lastName}` : l.userId ? l.userId.slice(0, 8) : "System"),
              },
            ]}
          />
        </div>
      </Card>
    </PageTransition>
  );
}
