"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
  catalogApi,
  catalogKeys,
  useCountries,
  useCities,
  useVehicleCategories,
  useVehicleBrands,
} from "@vrm/api-client";
import { Badge, Button, Card, DataTable, Input, Modal, PageTransition, Select, Tabs, useToast } from "@vrm/ui";

type Section = "countries" | "cities" | "categories" | "brands";

const TABS: { value: Section; label: string }[] = [
  { value: "countries", label: "Countries" },
  { value: "cities", label: "Cities" },
  { value: "categories", label: "Vehicle categories" },
  { value: "brands", label: "Vehicle brands" },
];

export function CatalogPage() {
  const [section, setSection] = useState<Section>("countries");
  const [modalOpen, setModalOpen] = useState(false);
  const toast = useToast();
  const qc = useQueryClient();

  const { data: countries, isLoading: loadingCountries } = useCountries();
  const { data: cities, isLoading: loadingCities } = useCities();
  const { data: categories, isLoading: loadingCategories } = useVehicleCategories();
  const { data: brands, isLoading: loadingBrands } = useVehicleBrands();

  const createCountry = useMutation({
    mutationFn: catalogApi.createCountry,
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.countries }),
  });
  const createCity = useMutation({
    mutationFn: catalogApi.createCity,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog", "cities"] }),
  });
  const createCategory = useMutation({
    mutationFn: catalogApi.createCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.categories }),
  });
  const createBrand = useMutation({
    mutationFn: catalogApi.createBrand,
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.brands }),
  });

  const countryForm = useForm<{ name: string; code: string }>();
  const cityForm = useForm<{ name: string; countryId: string; isPopular?: boolean }>();
  const categoryForm = useForm<{ name: string; slug: string }>();
  const brandForm = useForm<{ name: string }>();

  const onAdd = async () => {
    try {
      if (section === "countries") {
        await countryForm.handleSubmit(async (values) => {
          await createCountry.mutateAsync({ name: values.name, code: values.code.toUpperCase() });
        })();
      } else if (section === "cities") {
        await cityForm.handleSubmit(async (values) => {
          await createCity.mutateAsync({ name: values.name, countryId: values.countryId, isPopular: !!values.isPopular });
        })();
      } else if (section === "categories") {
        await categoryForm.handleSubmit(async (values) => {
          await createCategory.mutateAsync(values);
        })();
      } else {
        await brandForm.handleSubmit(async (values) => {
          await createBrand.mutateAsync(values);
        })();
      }
      toast.success("Added successfully");
      setModalOpen(false);
      countryForm.reset();
      cityForm.reset();
      categoryForm.reset();
      brandForm.reset();
    } catch (err) {
      toast.error("Could not save", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Catalog management</h1>
          <p className="text-sm text-primary-400">
            Countries, cities, vehicle categories, and brands. Creation only — there is no edit/delete endpoint
            for catalog entities yet.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add
        </Button>
      </div>

      <Tabs tabs={TABS} value={section} onChange={(v) => setSection(v as Section)} className="mb-6" />

      {section === "countries" && (
        <Card>
          <div className="p-5">
            <DataTable
              isLoading={loadingCountries}
              data={countries ?? []}
              keyFor={(c) => c.id}
              emptyTitle="No countries yet"
              columns={[
                { header: "Name", cell: (c) => c.name },
                { header: "Code", cell: (c) => c.code },
                { header: "Status", cell: (c) => <Badge tone={c.isActive ? "success" : "neutral"}>{c.isActive ? "Active" : "Inactive"}</Badge> },
              ]}
            />
          </div>
        </Card>
      )}

      {section === "cities" && (
        <Card>
          <div className="p-5">
            <DataTable
              isLoading={loadingCities}
              data={cities ?? []}
              keyFor={(c) => c.id}
              emptyTitle="No cities yet"
              columns={[
                { header: "Name", cell: (c) => c.name },
                { header: "Country", cell: (c) => c.country?.name ?? "—" },
                { header: "Popular", cell: (c) => (c.isPopular ? <Badge tone="accent">Popular</Badge> : "—") },
              ]}
            />
          </div>
        </Card>
      )}

      {section === "categories" && (
        <Card>
          <div className="p-5">
            <DataTable
              isLoading={loadingCategories}
              data={categories ?? []}
              keyFor={(c) => c.id}
              emptyTitle="No categories yet"
              columns={[
                { header: "Name", cell: (c) => c.name },
                { header: "Slug", cell: (c) => c.slug },
                { header: "Status", cell: (c) => <Badge tone={c.isActive ? "success" : "neutral"}>{c.isActive ? "Active" : "Inactive"}</Badge> },
              ]}
            />
          </div>
        </Card>
      )}

      {section === "brands" && (
        <Card>
          <div className="p-5">
            <DataTable
              isLoading={loadingBrands}
              data={brands ?? []}
              keyFor={(b) => b.id}
              emptyTitle="No brands yet"
              columns={[
                { header: "Name", cell: (b) => b.name },
                { header: "Status", cell: (b) => <Badge tone={b.isActive ? "success" : "neutral"}>{b.isActive ? "Active" : "Inactive"}</Badge> },
              ]}
            />
          </div>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Add ${TABS.find((t) => t.value === section)?.label.toLowerCase()}`}>
        {section === "countries" && (
          <div className="flex flex-col gap-4">
            <Input label="Name" {...countryForm.register("name", { required: true })} />
            <Input label="Code (2-3 letters)" maxLength={3} {...countryForm.register("code", { required: true })} />
            <Button onClick={onAdd} isLoading={createCountry.isPending} fullWidth>
              Add country
            </Button>
          </div>
        )}
        {section === "cities" && (
          <div className="flex flex-col gap-4">
            <Input label="Name" {...cityForm.register("name", { required: true })} />
            <Select
              label="Country"
              placeholder="Select a country"
              options={(countries ?? []).map((c) => ({ value: c.id, label: c.name }))}
              {...cityForm.register("countryId", { required: true })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...cityForm.register("isPopular")} /> Mark as popular
            </label>
            <Button onClick={onAdd} isLoading={createCity.isPending} fullWidth>
              Add city
            </Button>
          </div>
        )}
        {section === "categories" && (
          <div className="flex flex-col gap-4">
            <Input label="Name" {...categoryForm.register("name", { required: true })} />
            <Input label="Slug" placeholder="e.g. hatchback" {...categoryForm.register("slug", { required: true })} />
            <Button onClick={onAdd} isLoading={createCategory.isPending} fullWidth>
              Add category
            </Button>
          </div>
        )}
        {section === "brands" && (
          <div className="flex flex-col gap-4">
            <Input label="Name" {...brandForm.register("name", { required: true })} />
            <Button onClick={onAdd} isLoading={createBrand.isPending} fullWidth>
              Add brand
            </Button>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
