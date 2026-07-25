"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Ban, CheckCircle2, Trash2, ImageIcon, ArrowUp, ArrowDown } from "lucide-react";
import {
  useAdminHeroBanners,
  useCreateHeroBanner,
  useUpdateHeroBanner,
  useDeleteHeroBanner,
} from "@vrm/api-client";
import type { HeroBannerSlide } from "@vrm/api-client";
import { Badge, Button, Card, Checkbox, DataTable, FileUpload, Input, Modal, useToast } from "@vrm/ui";

const schema = z.object({
  title: z.string().min(1, "Required").max(200),
  subtitle: z
    .string()
    .max(300)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  ctaLabel: z
    .string()
    .max(50)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  ctaUrl: z
    .string()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  sortOrder: z.coerce.number().int(),
  isActive: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

export function HeroBannersSection() {
  const { data: slides, isLoading } = useAdminHeroBanners();
  const createSlide = useCreateHeroBanner();
  const updateSlide = useUpdateHeroBanner();
  const deleteSlide = useDeleteHeroBanner();
  const toast = useToast();

  const [editing, setEditing] = useState<HeroBannerSlide | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { sortOrder: 0 } });

  const nextSortOrder = (slides?.length ?? 0) + 1;

  const openCreate = () => {
    setEditing(null);
    reset({ title: "", subtitle: "", ctaLabel: "", ctaUrl: "", sortOrder: nextSortOrder });
    setImageUrl([]);
    setModalOpen(true);
  };

  const openEdit = (slide: HeroBannerSlide) => {
    setEditing(slide);
    reset({
      title: slide.title,
      subtitle: slide.subtitle ?? "",
      ctaLabel: slide.ctaLabel ?? "",
      ctaUrl: slide.ctaUrl ?? "",
      sortOrder: slide.sortOrder,
      isActive: slide.isActive,
    });
    setImageUrl([slide.imageUrl]);
    setModalOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!imageUrl[0]) {
      toast.error("A banner image is required");
      return;
    }
    const input = {
      title: values.title,
      subtitle: values.subtitle,
      imageUrl: imageUrl[0],
      ctaLabel: values.ctaLabel,
      ctaUrl: values.ctaUrl,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
    };
    try {
      if (editing) {
        await updateSlide.mutateAsync({ id: editing.id, input });
        toast.success("Slide updated");
      } else {
        await createSlide.mutateAsync(input);
        toast.success("Slide added");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error("Could not save slide", err instanceof Error ? err.message : undefined);
    }
  });

  const toggleActive = async (slide: HeroBannerSlide) => {
    try {
      await updateSlide.mutateAsync({ id: slide.id, input: { isActive: !slide.isActive } });
      toast.success(slide.isActive ? "Slide deactivated" : "Slide activated");
    } catch (err) {
      toast.error("Could not update slide", err instanceof Error ? err.message : undefined);
    }
  };

  const onDelete = async (slide: HeroBannerSlide) => {
    if (!confirm(`Delete "${slide.title}"? This cannot be undone.`)) return;
    try {
      await deleteSlide.mutateAsync(slide.id);
      toast.success("Slide deleted");
    } catch (err) {
      toast.error("Could not delete slide", err instanceof Error ? err.message : undefined);
    }
  };

  const move = async (slide: HeroBannerSlide, direction: "up" | "down") => {
    const sorted = [...(slides ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((s) => s.id === slide.id);
    const swapWith = direction === "up" ? sorted[index - 1] : sorted[index + 1];
    if (!swapWith) return;
    try {
      await Promise.all([
        updateSlide.mutateAsync({ id: slide.id, input: { sortOrder: swapWith.sortOrder } }),
        updateSlide.mutateAsync({ id: swapWith.id, input: { sortOrder: slide.sortOrder } }),
      ]);
    } catch (err) {
      toast.error("Could not reorder slides", err instanceof Error ? err.message : undefined);
    }
  };

  const sorted = [...(slides ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <ImageIcon size={18} /> Hero banner slides
          </h2>
          <p className="text-xs text-primary-400">Rotating slides shown at the top of the public homepage.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} /> New slide
        </Button>
      </div>

      <DataTable
        isLoading={isLoading}
        data={sorted}
        keyFor={(s) => s.id}
        emptyTitle="No hero banner slides yet"
        emptyDescription="Add up to a handful of slides to feature on the homepage hero."
        columns={[
          {
            header: "Preview",
            cell: (s) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.imageUrl} alt={s.title} className="h-12 w-20 rounded-lg object-cover" />
            ),
          },
          {
            header: "Slide",
            cell: (s) => (
              <div>
                <p className="font-semibold">{s.title}</p>
                {s.subtitle && <p className="max-w-xs truncate text-xs text-primary-400">{s.subtitle}</p>}
              </div>
            ),
          },
          { header: "Order", cell: (s) => s.sortOrder },
          {
            header: "Status",
            cell: (s) => <Badge tone={s.isActive ? "success" : "neutral"}>{s.isActive ? "Active" : "Inactive"}</Badge>,
          },
          {
            header: "Actions",
            cell: (s) => (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => move(s, "up")}>
                  <ArrowUp size={13} />
                </Button>
                <Button size="sm" variant="outline" onClick={() => move(s, "down")}>
                  <ArrowDown size={13} />
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                  <Pencil size={13} /> Edit
                </Button>
                <Button size="sm" variant={s.isActive ? "danger" : "secondary"} onClick={() => toggleActive(s)}>
                  {s.isActive ? (
                    <>
                      <Ban size={13} /> Deactivate
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} /> Activate
                    </>
                  )}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(s)}>
                  <Trash2 size={13} className="text-danger" />
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit slide" : "New slide"} size="lg">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input label="Title" error={errors.title?.message} {...register("title")} />
          <Input label="Subtitle (optional)" error={errors.subtitle?.message} {...register("subtitle")} />
          <FileUpload label="Banner image" value={imageUrl} onChange={setImageUrl} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="CTA button label (optional)" placeholder="e.g. Browse vehicles" {...register("ctaLabel")} />
            <Input label="CTA link (optional)" placeholder="e.g. /search" {...register("ctaUrl")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
            <Input
              label="Sort order"
              type="number"
              error={errors.sortOrder?.message}
              {...register("sortOrder")}
            />
            {editing && <Checkbox label="Active" {...register("isActive")} />}
          </div>
          <Button type="submit" isLoading={isSubmitting || createSlide.isPending || updateSlide.isPending} fullWidth>
            {editing ? "Save changes" : "Add slide"}
          </Button>
        </form>
      </Modal>
    </Card>
  );
}
