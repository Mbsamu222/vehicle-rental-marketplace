"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings2, Power, Plus, Ban, Pencil, Zap, Check, Clock } from "lucide-react";
import {
  useMonetizationFeatures,
  useUpdateMonetizationFeature,
  useBoostVehicle,
  useAdminAdSlots,
  useCreateAdSlot,
  useUpdateAdSlot,
  useDeleteAdSlot,
  useAdminAffiliatePartners,
  useCreateAffiliatePartner,
  useUpdateAffiliatePartner,
  useDeleteAffiliatePartner,
  useAdminSubscriptionPlans,
  useCreateSubscriptionPlan,
  useUpdateSubscriptionPlan,
  useDeleteSubscriptionPlan,
  usePendingSubscriptions,
  useConfirmSubscription,
} from "@vrm/api-client";
import type { MonetizationFeature, MonetizationFeatureKey, AdSlot, AffiliatePartner, SubscriptionPlan } from "@vrm/api-client";
import { Badge, Button, Card, DataTable, Input, Modal, PageTransition, Select, Tabs, Textarea, useToast } from "@vrm/ui";

const FEATURE_INFO: Record<MonetizationFeatureKey, { label: string; description: string }> = {
  BOOKING_COMMISSION: { label: "Booking commission", description: "Platform's cut of each completed booking, at the partner's commission rate." },
  PAYOUT_FEE: { label: "Payout / settlement fee", description: "Fee deducted from a partner payout, separate from commission." },
  SERVICE_FEE: { label: "Per-booking service fee", description: "Convenience fee added to the customer's checkout total." },
  EXTRA_DRIVER_FEE: { label: "Extra-driver surcharge", description: "Fee per additional driver declared at booking time." },
  YOUNG_DRIVER_FEE: { label: "Young-driver surcharge", description: "Flat fee when the customer self-declares as a young driver." },
  LATE_RETURN_FEE: { label: "Late-return fee", description: "Fee for returning a vehicle after the scheduled return time." },
  CANCELLATION_FEE: { label: "Cancellation fee", description: "Tiered fee deducted from a refund based on how close to pickup the booking is cancelled." },
  BOOSTED_LISTINGS: { label: "Boosted / featured listings", description: "Partners pay to rank their vehicles first in search and on the homepage." },
  SPONSORED_PLACEMENTS: { label: "Sponsored placements", description: "Paid placement in hero banners and the sponsors grid." },
  AFFILIATE_PROGRAM: { label: "Affiliate program", description: "Referral partners (insurance, roadside assistance, fuel) shown to customers." },
  PARTNER_SUBSCRIPTIONS: { label: "Partner subscription tiers", description: "Recurring plans that unlock more vehicles, lower commission, or analytics." },
  FLEET_ANALYTICS: { label: "Fleet analytics (paid add-on)", description: "Utilization and demand insights, gated behind a subscription plan feature." },
};

type Section = "features" | "boost" | "ads" | "affiliates" | "subscriptions";

const TABS: { value: Section; label: string }[] = [
  { value: "features", label: "Features" },
  { value: "boost", label: "Boosted listings" },
  { value: "ads", label: "Ad slots" },
  { value: "affiliates", label: "Affiliate partners" },
  { value: "subscriptions", label: "Subscriptions" },
];

export function MonetizationPage() {
  const [section, setSection] = useState<Section>("features");

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Monetization</h1>
        <p className="text-sm text-primary-400">
          Every revenue feature ships disabled by default. Turn one on whenever you&apos;re ready — nothing changes for
          customers or partners until you do.
        </p>
      </div>

      <Tabs tabs={TABS} value={section} onChange={(v) => setSection(v as Section)} className="mb-6" />

      {section === "features" && <FeaturesSection />}
      {section === "boost" && <BoostSection />}
      {section === "ads" && <AdSlotsSection />}
      {section === "affiliates" && <AffiliatePartnersSection />}
      {section === "subscriptions" && <SubscriptionsSection />}
    </PageTransition>
  );
}

function FeaturesSection() {
  const { data, isLoading } = useMonetizationFeatures();
  const updateFeature = useUpdateMonetizationFeature();
  const toast = useToast();

  const [configuring, setConfiguring] = useState<MonetizationFeature | null>(null);
  const [configDraft, setConfigDraft] = useState("");
  const [configError, setConfigError] = useState<string | undefined>();

  const toggleFeature = async (feature: MonetizationFeature) => {
    try {
      await updateFeature.mutateAsync({ key: feature.key, input: { isEnabled: !feature.isEnabled } });
      toast.success(feature.isEnabled ? "Feature disabled" : "Feature enabled");
    } catch (err) {
      toast.error("Could not update feature", err instanceof Error ? err.message : undefined);
    }
  };

  const openConfigure = (feature: MonetizationFeature) => {
    setConfiguring(feature);
    setConfigDraft(feature.config ? JSON.stringify(feature.config, null, 2) : "{}");
    setConfigError(undefined);
  };

  const saveConfig = async () => {
    if (!configuring) return;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(configDraft || "{}");
    } catch {
      setConfigError("Config must be valid JSON");
      return;
    }
    try {
      await updateFeature.mutateAsync({ key: configuring.key, input: { config: parsed } });
      toast.success("Configuration saved");
      setConfiguring(null);
    } catch (err) {
      toast.error("Could not save configuration", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <>
      <Card>
        <div className="p-5">
          <DataTable
            isLoading={isLoading}
            data={data ?? []}
            keyFor={(f) => f.id}
            emptyTitle="No monetization features registered"
            columns={[
              {
                header: "Feature",
                cell: (f) => (
                  <div>
                    <div className="font-semibold">{FEATURE_INFO[f.key]?.label ?? f.key}</div>
                    <div className="text-xs text-primary-400">{FEATURE_INFO[f.key]?.description}</div>
                  </div>
                ),
              },
              {
                header: "Status",
                cell: (f) => <Badge tone={f.isEnabled ? "success" : "neutral"}>{f.isEnabled ? "Enabled" : "Disabled"}</Badge>,
              },
              {
                header: "Actions",
                cell: (f) => (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openConfigure(f)}>
                      <Settings2 size={13} /> Configure
                    </Button>
                    <Button size="sm" variant={f.isEnabled ? "danger" : "primary"} onClick={() => toggleFeature(f)}>
                      <Power size={13} /> {f.isEnabled ? "Disable" : "Enable"}
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>

      <Modal
        open={!!configuring}
        onClose={() => setConfiguring(null)}
        title={configuring ? `Configure — ${FEATURE_INFO[configuring.key]?.label ?? configuring.key}` : ""}
        size="lg"
      >
        <div className="grid gap-4">
          <Textarea
            label="Config (JSON)"
            hint="Feature-specific parameters (rates, caps, tiers). Left as {} until this mechanism's rate logic is wired up."
            error={configError}
            value={configDraft}
            onChange={(e) => setConfigDraft(e.target.value)}
            rows={10}
            className="font-mono"
          />
          <Button onClick={saveConfig} isLoading={updateFeature.isPending} fullWidth>
            Save configuration
          </Button>
        </div>
      </Modal>
    </>
  );
}

const boostSchema = z.object({
  vehicleId: z.string().min(1, "Required"),
  days: z.coerce.number().int().positive("Must be at least 1 day"),
  amountCharged: z.coerce.number().min(0),
});
type BoostFormValues = z.infer<typeof boostSchema>;

function BoostSection() {
  const boostVehicle = useBoostVehicle();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BoostFormValues>({ resolver: zodResolver(boostSchema), defaultValues: { days: 7, amountCharged: 0 } });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await boostVehicle.mutateAsync({ id: values.vehicleId, days: values.days, amountCharged: values.amountCharged });
      toast.success("Vehicle boosted — it will rank first in search while the feature is enabled");
      reset({ vehicleId: "", days: 7, amountCharged: 0 });
    } catch (err) {
      toast.error("Could not boost vehicle", err instanceof Error ? err.message : undefined);
    }
  });

  return (
    <Card>
      <div className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Zap size={16} className="text-secondary" />
          <p className="text-sm text-primary-400">
            Grant a vehicle featured placement. It only affects search ordering while &quot;Boosted / featured
            listings&quot; is enabled on the Features tab. Find a vehicle&apos;s ID from its partner listing or its
            public page URL.
          </p>
        </div>
        <form onSubmit={onSubmit} className="grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <Input label="Vehicle ID" error={errors.vehicleId?.message} {...register("vehicleId")} />
          </div>
          <Input label="Days" type="number" error={errors.days?.message} {...register("days")} />
          <Input label="Amount charged" type="number" step="0.01" error={errors.amountCharged?.message} {...register("amountCharged")} />
          <div className="flex items-end">
            <Button type="submit" isLoading={isSubmitting} fullWidth>
              Boost vehicle
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}

const adSlotSchema = z.object({
  title: z.string().min(1, "Required").max(200),
  subtitle: z.string().optional(),
  imageUrl: z.string().min(1, "Required"),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional(),
  sponsorName: z.string().optional(),
  amountCharged: z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined)),
  sortOrder: z.coerce.number().int().default(0),
});
type AdSlotFormValues = z.infer<typeof adSlotSchema>;

function AdSlotsSection() {
  const { data, isLoading } = useAdminAdSlots();
  const createAdSlot = useCreateAdSlot();
  const updateAdSlot = useUpdateAdSlot();
  const deleteAdSlot = useDeleteAdSlot();
  const toast = useToast();

  const [editing, setEditing] = useState<AdSlot | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdSlotFormValues>({ resolver: zodResolver(adSlotSchema), defaultValues: { sortOrder: 0 } });

  const openCreate = () => {
    setEditing(null);
    reset({ title: "", subtitle: "", imageUrl: "", ctaLabel: "", ctaUrl: "", sponsorName: "", amountCharged: undefined, sortOrder: 0 });
    setModalOpen(true);
  };

  const openEdit = (slot: AdSlot) => {
    setEditing(slot);
    reset({
      title: slot.title,
      subtitle: slot.subtitle ?? "",
      imageUrl: slot.imageUrl,
      ctaLabel: slot.ctaLabel ?? "",
      ctaUrl: slot.ctaUrl ?? "",
      sponsorName: slot.sponsorName ?? "",
      amountCharged: slot.amountCharged ? Number(slot.amountCharged) : undefined,
      sortOrder: slot.sortOrder,
    });
    setModalOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editing) {
        await updateAdSlot.mutateAsync({ id: editing.id, input: values });
        toast.success("Ad slot updated");
      } else {
        await createAdSlot.mutateAsync(values);
        toast.success("Ad slot created");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error("Could not save ad slot", err instanceof Error ? err.message : undefined);
    }
  });

  const onDeactivate = async (id: string) => {
    try {
      await deleteAdSlot.mutateAsync(id);
      toast.success("Ad slot removed");
    } catch (err) {
      toast.error("Could not remove ad slot", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus size={16} /> New ad slot
        </Button>
      </div>
      <Card>
        <div className="p-5">
          <DataTable
            isLoading={isLoading}
            data={data ?? []}
            keyFor={(s) => s.id}
            emptyTitle="No ad slots yet"
            emptyDescription="Ad slots only render publicly once Sponsored placements is enabled on the Features tab."
            columns={[
              { header: "Title", cell: (s) => <span className="font-semibold">{s.title}</span> },
              { header: "Sponsor", cell: (s) => s.sponsorName ?? "—" },
              { header: "Amount", cell: (s) => (s.amountCharged ? `₹${s.amountCharged}` : "—") },
              { header: "Status", cell: (s) => <Badge tone={s.isActive ? "success" : "neutral"}>{s.isActive ? "Active" : "Inactive"}</Badge> },
              {
                header: "Actions",
                cell: (s) => (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                      <Pencil size={13} /> Edit
                    </Button>
                    {s.isActive && (
                      <Button size="sm" variant="danger" onClick={() => onDeactivate(s.id)}>
                        <Ban size={13} /> Remove
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit ad slot" : "New ad slot"} size="lg">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Title" error={errors.title?.message} {...register("title")} />
          <Input label="Sponsor name" {...register("sponsorName")} />
          <div className="sm:col-span-2">
            <Input label="Subtitle" {...register("subtitle")} />
          </div>
          <div className="sm:col-span-2">
            <Input label="Image URL" error={errors.imageUrl?.message} {...register("imageUrl")} />
          </div>
          <Input label="CTA label" {...register("ctaLabel")} />
          <Input label="CTA URL" {...register("ctaUrl")} />
          <Input label="Amount charged" type="number" step="0.01" {...register("amountCharged")} />
          <Input label="Sort order" type="number" {...register("sortOrder")} />
          <div className="sm:col-span-2">
            <Button type="submit" isLoading={isSubmitting} fullWidth>
              {editing ? "Save changes" : "Create ad slot"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

const affiliateSchema = z.object({
  name: z.string().min(1, "Required").max(200),
  category: z.enum(["INSURANCE", "ROADSIDE_ASSISTANCE", "FUEL", "OTHER"]),
  tagline: z.string().optional(),
  ctaLabel: z.string().optional(),
  referralUrl: z.string().min(1, "Required"),
  logoUrl: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
});
type AffiliateFormValues = z.infer<typeof affiliateSchema>;

function AffiliatePartnersSection() {
  const { data, isLoading } = useAdminAffiliatePartners();
  const createPartner = useCreateAffiliatePartner();
  const updatePartner = useUpdateAffiliatePartner();
  const deletePartner = useDeleteAffiliatePartner();
  const toast = useToast();

  const [editing, setEditing] = useState<AffiliatePartner | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AffiliateFormValues>({ resolver: zodResolver(affiliateSchema), defaultValues: { category: "OTHER", sortOrder: 0 } });

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", category: "OTHER", tagline: "", ctaLabel: "", referralUrl: "", logoUrl: "", sortOrder: 0 });
    setModalOpen(true);
  };

  const openEdit = (partner: AffiliatePartner) => {
    setEditing(partner);
    reset({
      name: partner.name,
      category: partner.category,
      tagline: partner.tagline ?? "",
      ctaLabel: partner.ctaLabel ?? "",
      referralUrl: partner.referralUrl,
      logoUrl: partner.logoUrl ?? "",
      sortOrder: partner.sortOrder,
    });
    setModalOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editing) {
        await updatePartner.mutateAsync({ id: editing.id, input: values });
        toast.success("Affiliate partner updated");
      } else {
        await createPartner.mutateAsync(values);
        toast.success("Affiliate partner created");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error("Could not save affiliate partner", err instanceof Error ? err.message : undefined);
    }
  });

  const onDeactivate = async (id: string) => {
    try {
      await deletePartner.mutateAsync(id);
      toast.success("Affiliate partner removed");
    } catch (err) {
      toast.error("Could not remove affiliate partner", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus size={16} /> New affiliate partner
        </Button>
      </div>
      <Card>
        <div className="p-5">
          <DataTable
            isLoading={isLoading}
            data={data ?? []}
            keyFor={(p) => p.id}
            emptyTitle="No affiliate partners yet"
            emptyDescription="Affiliate partners only render publicly once Affiliate program is enabled on the Features tab."
            columns={[
              { header: "Name", cell: (p) => <span className="font-semibold">{p.name}</span> },
              { header: "Category", cell: (p) => p.category.replace("_", " ") },
              { header: "Status", cell: (p) => <Badge tone={p.isActive ? "success" : "neutral"}>{p.isActive ? "Active" : "Inactive"}</Badge> },
              {
                header: "Actions",
                cell: (p) => (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                      <Pencil size={13} /> Edit
                    </Button>
                    {p.isActive && (
                      <Button size="sm" variant="danger" onClick={() => onDeactivate(p.id)}>
                        <Ban size={13} /> Remove
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit affiliate partner" : "New affiliate partner"} size="lg">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Name" error={errors.name?.message} {...register("name")} />
          <Select
            label="Category"
            options={[
              { value: "INSURANCE", label: "Insurance" },
              { value: "ROADSIDE_ASSISTANCE", label: "Roadside assistance" },
              { value: "FUEL", label: "Fuel" },
              { value: "OTHER", label: "Other" },
            ]}
            {...register("category")}
          />
          <div className="sm:col-span-2">
            <Input label="Tagline" {...register("tagline")} />
          </div>
          <Input label="CTA label" {...register("ctaLabel")} />
          <Input label="Referral URL" error={errors.referralUrl?.message} {...register("referralUrl")} />
          <Input label="Logo URL" {...register("logoUrl")} />
          <Input label="Sort order" type="number" {...register("sortOrder")} />
          <div className="sm:col-span-2">
            <Button type="submit" isLoading={isSubmitting} fullWidth>
              {editing ? "Save changes" : "Create affiliate partner"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

const planSchema = z.object({
  name: z.string().min(1, "Required").max(150),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  durationDays: z.coerce.number().int().positive(),
  maxVehicles: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
  featuresJson: z.string().optional(),
});
type PlanFormValues = z.infer<typeof planSchema>;

function SubscriptionsSection() {
  const { data: plans, isLoading } = useAdminSubscriptionPlans();
  const createPlan = useCreateSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan();
  const deletePlan = useDeleteSubscriptionPlan();
  const { data: pending, isLoading: pendingLoading } = usePendingSubscriptions();
  const confirmSubscription = useConfirmSubscription();
  const toast = useToast();

  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [featuresError, setFeaturesError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormValues>({ resolver: zodResolver(planSchema) });

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", description: "", price: 0, durationDays: 30, maxVehicles: undefined, featuresJson: "{}" });
    setFeaturesError(undefined);
    setModalOpen(true);
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditing(plan);
    reset({
      name: plan.name,
      description: plan.description ?? "",
      price: Number(plan.price),
      durationDays: plan.durationDays,
      maxVehicles: plan.maxVehicles ?? undefined,
      featuresJson: plan.features ? JSON.stringify(plan.features, null, 2) : "{}",
    });
    setFeaturesError(undefined);
    setModalOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    let features: Record<string, unknown> | undefined;
    try {
      features = values.featuresJson ? JSON.parse(values.featuresJson) : undefined;
    } catch {
      setFeaturesError("Features must be valid JSON");
      return;
    }
    const input = {
      name: values.name,
      description: values.description || undefined,
      price: values.price,
      durationDays: values.durationDays,
      maxVehicles: values.maxVehicles,
      features,
    };
    try {
      if (editing) {
        await updatePlan.mutateAsync({ id: editing.id, input });
        toast.success("Plan updated");
      } else {
        await createPlan.mutateAsync(input);
        toast.success("Plan created");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error("Could not save plan", err instanceof Error ? err.message : undefined);
    }
  });

  const onDeactivate = async (id: string) => {
    try {
      await deletePlan.mutateAsync(id);
      toast.success("Plan deactivated");
    } catch (err) {
      toast.error("Could not deactivate plan", err instanceof Error ? err.message : undefined);
    }
  };

  const onConfirm = async (id: string) => {
    try {
      await confirmSubscription.mutateAsync(id);
      toast.success("Subscription activated");
    } catch (err) {
      toast.error("Could not confirm subscription", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <>
      <Card className="mb-6">
        <div className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Clock size={16} className="text-secondary" />
            <h3 className="font-heading font-semibold">Pending confirmations</h3>
          </div>
          <DataTable
            isLoading={pendingLoading}
            data={pending ?? []}
            keyFor={(s) => s.id}
            emptyTitle="No pending requests"
            emptyDescription="Partner subscription requests awaiting offline-payment confirmation will show up here."
            columns={[
              { header: "Partner", cell: (s) => s.rentalPartner?.businessName ?? "—" },
              { header: "Plan", cell: (s) => s.plan?.name ?? "—" },
              { header: "Requested", cell: (s) => new Date(s.startedAt).toLocaleString() },
              {
                header: "Actions",
                cell: (s) => (
                  <Button size="sm" onClick={() => onConfirm(s.id)} isLoading={confirmSubscription.isPending}>
                    <Check size={13} /> Confirm payment received
                  </Button>
                ),
              },
            ]}
          />
        </div>
      </Card>

      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus size={16} /> New plan
        </Button>
      </div>
      <Card>
        <div className="p-5">
          <DataTable
            isLoading={isLoading}
            data={plans ?? []}
            keyFor={(p) => p.id}
            emptyTitle="No subscription plans yet"
            columns={[
              { header: "Name", cell: (p) => <span className="font-semibold">{p.name}</span> },
              { header: "Price", cell: (p) => `₹${p.price} / ${p.durationDays}d` },
              { header: "Max vehicles", cell: (p) => p.maxVehicles ?? "Unlimited" },
              { header: "Status", cell: (p) => <Badge tone={p.isActive ? "success" : "neutral"}>{p.isActive ? "Active" : "Inactive"}</Badge> },
              {
                header: "Actions",
                cell: (p) => (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                      <Pencil size={13} /> Edit
                    </Button>
                    {p.isActive && (
                      <Button size="sm" variant="danger" onClick={() => onDeactivate(p.id)}>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit plan" : "New plan"} size="lg">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Name" error={errors.name?.message} {...register("name")} />
          <Input label="Price" type="number" step="0.01" error={errors.price?.message} {...register("price")} />
          <div className="sm:col-span-2">
            <Input label="Description" {...register("description")} />
          </div>
          <Input label="Duration (days)" type="number" error={errors.durationDays?.message} {...register("durationDays")} />
          <Input label="Max vehicles (blank = unlimited)" type="number" {...register("maxVehicles")} />
          <div className="sm:col-span-2">
            <Textarea
              label="Features (JSON)"
              hint='e.g. {"analytics": true, "commissionOverride": 7, "listingBoost": true}'
              error={featuresError}
              rows={6}
              className="font-mono"
              {...register("featuresJson")}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" isLoading={isSubmitting} fullWidth>
              {editing ? "Save changes" : "Create plan"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
