"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Ban, Pencil } from "lucide-react";
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon } from "@vrm/api-client";
import type { Coupon } from "@vrm/api-client";
import { Badge, Button, Card, DataTable, Input, Modal, PageTransition, Select, useToast } from "@vrm/ui";

const schema = z.object({
  code: z.string().min(3, "At least 3 characters").max(30),
  type: z.enum(["FLAT", "PERCENTAGE"]),
  value: z.coerce.number().positive("Must be positive"),
  maxDiscount: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
  minBookingValue: z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined)),
  usageLimit: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
  perUserLimit: z.coerce.number().int().positive().default(1),
  validFrom: z.string().min(1, "Required"),
  validUntil: z.string().min(1, "Required"),
});
type FormValues = z.infer<typeof schema>;

export function CouponsPage() {
  const { data, isLoading } = useCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const toast = useToast();

  const [editing, setEditing] = useState<Coupon | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { type: "FLAT", perUserLimit: 1 } });

  const openCreate = () => {
    setEditing(null);
    reset({ code: "", type: "FLAT", value: 0, perUserLimit: 1, validFrom: "", validUntil: "" });
    setModalOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    reset({
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : undefined,
      minBookingValue: coupon.minBookingValue ? Number(coupon.minBookingValue) : undefined,
      usageLimit: coupon.usageLimit ?? undefined,
      perUserLimit: coupon.perUserLimit,
      validFrom: coupon.validFrom.slice(0, 10),
      validUntil: coupon.validUntil.slice(0, 10),
    });
    setModalOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      code: values.code.toUpperCase(),
      type: values.type,
      value: values.value,
      maxDiscount: values.maxDiscount,
      minBookingValue: values.minBookingValue,
      usageLimit: values.usageLimit,
      perUserLimit: values.perUserLimit,
      validFrom: new Date(values.validFrom).toISOString(),
      validUntil: new Date(values.validUntil).toISOString(),
    };
    try {
      if (editing) {
        await updateCoupon.mutateAsync({ id: editing.id, input });
        toast.success("Coupon updated");
      } else {
        await createCoupon.mutateAsync(input);
        toast.success("Coupon created");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error("Could not save coupon", err instanceof Error ? err.message : undefined);
    }
  });

  const onDeactivate = async (id: string) => {
    try {
      await deleteCoupon.mutateAsync(id);
      toast.success("Coupon deactivated");
    } catch (err) {
      toast.error("Could not deactivate coupon", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Coupons</h1>
          <p className="text-sm text-primary-400">Create and manage discount codes.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> New coupon
        </Button>
      </div>

      <Card>
        <div className="p-5">
          <DataTable
            isLoading={isLoading}
            data={data?.data ?? []}
            keyFor={(c) => c.id}
            emptyTitle="No coupons yet"
            columns={[
              { header: "Code", cell: (c) => <span className="font-mono font-semibold">{c.code}</span> },
              {
                header: "Value",
                cell: (c) => (c.type === "PERCENTAGE" ? `${c.value}%` : `₹${c.value}`),
              },
              { header: "Usage", cell: (c) => `${c.usageCount}${c.usageLimit ? ` / ${c.usageLimit}` : ""}` },
              { header: "Valid until", cell: (c) => new Date(c.validUntil).toLocaleDateString() },
              { header: "Status", cell: (c) => <Badge tone={c.isActive ? "success" : "neutral"}>{c.isActive ? "Active" : "Inactive"}</Badge> },
              {
                header: "Actions",
                cell: (c) => (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                      <Pencil size={13} /> Edit
                    </Button>
                    {c.isActive && (
                      <Button size="sm" variant="danger" onClick={() => onDeactivate(c.id)}>
                        <Ban size={13} /> Deactivate
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit coupon" : "New coupon"} size="lg">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Code" error={errors.code?.message} {...register("code")} />
          <Select
            label="Type"
            options={[
              { value: "FLAT", label: "Flat amount" },
              { value: "PERCENTAGE", label: "Percentage" },
            ]}
            {...register("type")}
          />
          <Input label="Value" type="number" step="0.01" error={errors.value?.message} {...register("value")} />
          <Input label="Max discount (optional)" type="number" step="0.01" {...register("maxDiscount")} />
          <Input label="Min booking value (optional)" type="number" step="0.01" {...register("minBookingValue")} />
          <Input label="Usage limit (optional)" type="number" {...register("usageLimit")} />
          <Input label="Per-user limit" type="number" {...register("perUserLimit")} />
          <div />
          <Input label="Valid from" type="date" error={errors.validFrom?.message} {...register("validFrom")} />
          <Input label="Valid until" type="date" error={errors.validUntil?.message} {...register("validUntil")} />
          <div className="sm:col-span-2">
            <Button type="submit" isLoading={isSubmitting} fullWidth>
              {editing ? "Save changes" : "Create coupon"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageTransition>
  );
}
