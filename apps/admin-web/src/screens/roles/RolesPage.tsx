"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Lock, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import {
  useRoles,
  usePermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAssignRole,
  useAdminUsers,
} from "@vrm/api-client";
import type { Permission, Role } from "@vrm/api-client";
import { Badge, Button, Card, Checkbox, EmptyState, Input, Modal, PageTransition, Select, useToast } from "@vrm/ui";

export function RolesPage() {
  const { data: roles, isLoading } = useRoles();
  const { data: permissions } = usePermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const assignRole = useAssignRole();
  const toast = useToast();

  const { data: adminUsers } = useAdminUsers({ userType: "ADMIN" });
  const { data: superAdminUsers } = useAdminUsers({ userType: "SUPER_ADMIN" });
  const assignableUsers = [...(adminUsers?.data ?? []), ...(superAdminUsers?.data ?? [])];

  const [editing, setEditing] = useState<Role | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const { register, handleSubmit, reset } = useForm<{ name: string; description?: string }>();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignRoleId, setAssignRoleId] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState("");

  useEffect(() => {
    if (editing) {
      reset({ name: editing.name, description: editing.description ?? "" });
      setSelectedPermissionIds(editing.permissions?.map((p) => p.id) ?? []);
    }
  }, [editing, reset]);

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", description: "" });
    setSelectedPermissionIds([]);
    setRoleModalOpen(true);
  };

  const togglePermission = (id: string) => {
    setSelectedPermissionIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const onSubmitRole = handleSubmit(async (values) => {
    try {
      if (editing) {
        await updateRole.mutateAsync({
          id: editing.id,
          input: { name: values.name, description: values.description, permissionIds: selectedPermissionIds },
        });
        toast.success("Role updated");
      } else {
        await createRole.mutateAsync({ name: values.name, description: values.description, permissionIds: selectedPermissionIds });
        toast.success("Role created");
      }
      setRoleModalOpen(false);
    } catch (err) {
      toast.error("Could not save role", err instanceof Error ? err.message : undefined);
    }
  });

  const onDeleteRole = async (role: Role) => {
    try {
      await deleteRole.mutateAsync(role.id);
      toast.success("Role deleted");
    } catch (err) {
      toast.error("Could not delete role", err instanceof Error ? err.message : undefined);
    }
  };

  const onAssign = async () => {
    if (!assignRoleId || !assignUserId) return;
    try {
      await assignRole.mutateAsync({ userId: assignUserId, roleId: assignRoleId });
      toast.success("Role assigned");
      setAssignModalOpen(false);
      setAssignUserId("");
    } catch (err) {
      toast.error("Could not assign role", err instanceof Error ? err.message : undefined);
    }
  };

  const permissionsByModule = (permissions ?? []).reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Roles &amp; permissions</h1>
          <p className="text-sm text-primary-400">Define admin roles and assign them to ADMIN/SUPER_ADMIN accounts.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> New role
        </Button>
      </div>

      {isLoading ? null : !roles?.length ? (
        <EmptyState title="No roles yet" description="Create the first role to start granting scoped permissions." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="flex items-center gap-1.5 font-semibold">
                    {role.name}
                    {role.isSystem && <Lock size={13} className="text-primary-300" />}
                  </p>
                  {role.description && <p className="text-xs text-primary-400">{role.description}</p>}
                </div>
                {role.isSystem && <Badge tone="neutral">System</Badge>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(role.permissions ?? []).map((p) => (
                  <Badge key={p.id} tone="info">
                    {p.key}
                  </Badge>
                ))}
                {!role.permissions?.length && <span className="text-xs text-primary-400">No permissions assigned</span>}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={role.isSystem}
                  onClick={() => {
                    setEditing(role);
                    setRoleModalOpen(true);
                  }}
                >
                  <Pencil size={13} /> Edit
                </Button>
                <Button size="sm" variant="danger" disabled={role.isSystem} onClick={() => onDeleteRole(role)}>
                  <Trash2 size={13} /> Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAssignRoleId(role.id);
                    setAssignModalOpen(true);
                  }}
                >
                  <UserPlus size={13} /> Assign
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={roleModalOpen} onClose={() => setRoleModalOpen(false)} title={editing ? "Edit role" : "New role"} size="lg">
        <form onSubmit={onSubmitRole} className="flex flex-col gap-4">
          <Input label="Name" required {...register("name", { required: true })} />
          <Input label="Description (optional)" {...register("description")} />
          <div>
            <p className="mb-2 text-sm font-medium text-primary dark:text-white">Permissions</p>
            <div className="flex max-h-72 flex-col gap-4 overflow-y-auto rounded-xl border border-border p-3 dark:border-dark-border">
              {Object.entries(permissionsByModule).map(([module, perms]) => (
                <div key={module}>
                  <p className="mb-1.5 text-xs font-semibold uppercase text-primary-400">{module}</p>
                  <div className="flex flex-col gap-1.5">
                    {perms.map((p) => (
                      <Checkbox
                        key={p.id}
                        label={p.key}
                        checked={selectedPermissionIds.includes(p.id)}
                        onChange={() => togglePermission(p.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Button type="submit" isLoading={createRole.isPending || updateRole.isPending} fullWidth>
            {editing ? "Save changes" : "Create role"}
          </Button>
        </form>
      </Modal>

      <Modal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign role to admin user">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-primary-400">
            Only ADMIN and SUPER_ADMIN accounts can hold an RBAC role — the backend rejects any other user type.
          </p>
          <Select
            label="Admin user"
            placeholder="Select a user"
            value={assignUserId}
            onChange={(e) => setAssignUserId(e.target.value)}
            options={assignableUsers.map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName} (${u.email})` }))}
          />
          <Button onClick={onAssign} isLoading={assignRole.isPending} fullWidth disabled={!assignUserId}>
            Assign role
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}
