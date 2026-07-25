"use client";

import { useState } from "react";
import { Ban, CheckCircle2, ShieldAlert, Users as UsersIcon } from "lucide-react";
import { useAdminUsers, useUpdateUserStatus } from "@vrm/api-client";
import type { AccountStatus, UserType } from "@vrm/api-client";
import { Badge, Button, Card, DataTable, Dropdown, Link, PageTransition, Select, Tabs, useToast } from "@vrm/ui";

const USER_TYPE_TABS: { value: string; label: string }[] = [
  { value: "CUSTOMER", label: "Customers" },
  { value: "RENTAL_PARTNER", label: "Rental partners" },
  { value: "ADMIN", label: "Admins" },
  { value: "SUPER_ADMIN", label: "Super admins" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING_VERIFICATION", label: "Pending verification" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "BANNED", label: "Banned" },
];

const statusTone: Record<AccountStatus, "warning" | "success" | "danger" | "neutral"> = {
  PENDING_VERIFICATION: "warning",
  ACTIVE: "success",
  SUSPENDED: "danger",
  BANNED: "danger",
};

export function UsersPage() {
  const [userType, setUserType] = useState<UserType>("CUSTOMER");
  const [status, setStatus] = useState("");
  const { data, isLoading } = useAdminUsers({ userType, status: status || undefined });
  const updateStatus = useUpdateUserStatus();
  const toast = useToast();

  const onChangeStatus = async (id: string, next: "ACTIVE" | "SUSPENDED" | "BANNED") => {
    try {
      await updateStatus.mutateAsync({ id, status: next });
      toast.success("Account status updated");
    } catch (err) {
      toast.error("Could not update status", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">User management</h1>
        <p className="text-sm text-primary-400">Review accounts and manage their status across every user type.</p>
      </div>

      <Tabs
        tabs={USER_TYPE_TABS}
        value={userType}
        onChange={(v) => setUserType(v as UserType)}
        className="mb-4"
      />

      <div className="mb-4 max-w-xs">
        <Select options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
      </div>

      <Card>
        <div className="p-5">
          <DataTable
            isLoading={isLoading}
            data={data?.data ?? []}
            keyFor={(u) => u.id}
            emptyTitle="No users found"
            emptyDescription="Try a different filter combination."
            columns={[
              {
                header: "Name",
                cell: (u) =>
                  userType === "CUSTOMER" ? (
                    <Link to={`/users/${u.id}`} className="hover:underline">
                      <p className="font-semibold">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-primary-400">{u.email}</p>
                    </Link>
                  ) : (
                    <div>
                      <p className="font-semibold">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-primary-400">{u.email}</p>
                    </div>
                  ),
              },
              { header: "Phone", cell: (u) => u.phone ?? "—" },
              {
                header: "Status",
                cell: (u) => <Badge tone={statusTone[u.accountStatus]}>{u.accountStatus.replace(/_/g, " ")}</Badge>,
              },
              { header: "Joined", cell: (u) => new Date(u.createdAt).toLocaleDateString() },
              {
                header: "Actions",
                cell: (u) => (
                  <Dropdown
                    trigger={
                      <Button variant="outline" size="sm" className="text-xs font-medium">
                        Change status
                      </Button>
                    }
                    items={[
                      {
                        label: "Set active",
                        icon: <CheckCircle2 size={14} />,
                        onClick: () => onChangeStatus(u.id, "ACTIVE"),
                      },
                      {
                        label: "Suspend",
                        icon: <ShieldAlert size={14} />,
                        onClick: () => onChangeStatus(u.id, "SUSPENDED"),
                      },
                      {
                        label: "Ban",
                        icon: <Ban size={14} />,
                        onClick: () => onChangeStatus(u.id, "BANNED"),
                        danger: true,
                      },
                    ]}
                  />
                ),
              },
            ]}
          />
        </div>
      </Card>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-primary-400">
        <UsersIcon size={13} /> ADMIN and SUPER_ADMIN accounts shown here can be granted an RBAC role from the
        Roles &amp; Permissions page.
      </p>
    </PageTransition>
  );
}
