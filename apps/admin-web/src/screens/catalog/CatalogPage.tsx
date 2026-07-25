"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Ban, CheckCircle2 } from "lucide-react";
import {
  useAdminCountries,
  useAdminCities,
  useAdminVehicleCategories,
  useAdminVehicleBrands,
  useCreateCountry,
  useUpdateCountry,
  useDeleteCountry,
  useCreateCity,
  useUpdateCity,
  useDeleteCity,
  useCreateVehicleCategory,
  useUpdateVehicleCategory,
  useDeleteVehicleCategory,
  useCreateVehicleBrand,
  useUpdateVehicleBrand,
  useDeleteVehicleBrand,
} from "@vrm/api-client";
import type { Country, City, VehicleCategory, VehicleBrand } from "@vrm/api-client";
import { Badge, Button, Card, Checkbox, DataTable, Input, Modal, PageTransition, Select, Tabs, useToast } from "@vrm/ui";

type Section = "countries" | "cities" | "categories" | "brands";

const TABS: { value: Section; label: string }[] = [
  { value: "countries", label: "Countries" },
  { value: "cities", label: "Cities" },
  { value: "categories", label: "Vehicle categories" },
  { value: "brands", label: "Vehicle brands" },
];

const urlField = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || /^https?:\/\//.test(v), "Must be a valid URL");

const countrySchema = z.object({
  name: z.string().min(1, "Required").max(100),
  code: z.string().min(2, "2-3 letters").max(3, "2-3 letters"),
  isActive: z.boolean().optional(),
});
type CountryForm = z.infer<typeof countrySchema>;

const citySchema = z.object({
  name: z.string().min(1, "Required").max(100),
  countryId: z.string().min(1, "Required"),
  isPopular: z.boolean().optional(),
  imageUrl: urlField,
  isActive: z.boolean().optional(),
});
type CityForm = z.infer<typeof citySchema>;

const categorySchema = z.object({
  name: z.string().min(1, "Required").max(100),
  slug: z.string().min(1, "Required").max(100),
  iconUrl: urlField,
  isActive: z.boolean().optional(),
});
type CategoryForm = z.infer<typeof categorySchema>;

const brandSchema = z.object({
  name: z.string().min(1, "Required").max(100),
  logoUrl: urlField,
  isActive: z.boolean().optional(),
});
type BrandForm = z.infer<typeof brandSchema>;

export function CatalogPage() {
  const [section, setSection] = useState<Section>("countries");
  const [modalOpen, setModalOpen] = useState(false);
  const toast = useToast();

  const { data: countries, isLoading: loadingCountries } = useAdminCountries();
  const { data: cities, isLoading: loadingCities } = useAdminCities();
  const { data: categories, isLoading: loadingCategories } = useAdminVehicleCategories();
  const { data: brands, isLoading: loadingBrands } = useAdminVehicleBrands();

  const createCountry = useCreateCountry();
  const updateCountry = useUpdateCountry();
  const deleteCountry = useDeleteCountry();
  const createCity = useCreateCity();
  const updateCity = useUpdateCity();
  const deleteCity = useDeleteCity();
  const createCategory = useCreateVehicleCategory();
  const updateCategory = useUpdateVehicleCategory();
  const deleteCategory = useDeleteVehicleCategory();
  const createBrand = useCreateVehicleBrand();
  const updateBrand = useUpdateVehicleBrand();
  const deleteBrand = useDeleteVehicleBrand();

  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [editingCategory, setEditingCategory] = useState<VehicleCategory | null>(null);
  const [editingBrand, setEditingBrand] = useState<VehicleBrand | null>(null);

  const countryForm = useForm<CountryForm>({ resolver: zodResolver(countrySchema), defaultValues: { name: "", code: "" } });
  const cityForm = useForm<CityForm>({ resolver: zodResolver(citySchema), defaultValues: { name: "", countryId: "" } });
  const categoryForm = useForm<CategoryForm>({ resolver: zodResolver(categorySchema), defaultValues: { name: "", slug: "" } });
  const brandForm = useForm<BrandForm>({ resolver: zodResolver(brandSchema), defaultValues: { name: "" } });

  const openCreate = () => {
    setEditingCountry(null);
    setEditingCity(null);
    setEditingCategory(null);
    setEditingBrand(null);
    countryForm.reset({ name: "", code: "" });
    cityForm.reset({ name: "", countryId: "", isPopular: false, imageUrl: "" });
    categoryForm.reset({ name: "", slug: "", iconUrl: "" });
    brandForm.reset({ name: "", logoUrl: "" });
    setModalOpen(true);
  };

  const openEditCountry = (c: Country) => {
    setEditingCountry(c);
    countryForm.reset({ name: c.name, code: c.code, isActive: c.isActive });
    setModalOpen(true);
  };
  const openEditCity = (c: City) => {
    setEditingCity(c);
    cityForm.reset({
      name: c.name,
      countryId: c.countryId,
      isPopular: c.isPopular,
      imageUrl: c.imageUrl ?? "",
      isActive: c.isActive,
    });
    setModalOpen(true);
  };
  const openEditCategory = (c: VehicleCategory) => {
    setEditingCategory(c);
    categoryForm.reset({ name: c.name, slug: c.slug, iconUrl: c.iconUrl ?? "", isActive: c.isActive });
    setModalOpen(true);
  };
  const openEditBrand = (b: VehicleBrand) => {
    setEditingBrand(b);
    brandForm.reset({ name: b.name, logoUrl: b.logoUrl ?? "", isActive: b.isActive });
    setModalOpen(true);
  };

  const onSubmitCountry = countryForm.handleSubmit(async (values) => {
    try {
      const input = { name: values.name, code: values.code.toUpperCase(), isActive: values.isActive };
      if (editingCountry) {
        await updateCountry.mutateAsync({ id: editingCountry.id, input });
        toast.success("Country updated");
      } else {
        await createCountry.mutateAsync({ name: input.name, code: input.code });
        toast.success("Country added");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error("Could not save country", err instanceof Error ? err.message : undefined);
    }
  });

  const onSubmitCity = cityForm.handleSubmit(async (values) => {
    try {
      const input = {
        name: values.name,
        countryId: values.countryId,
        isPopular: !!values.isPopular,
        imageUrl: values.imageUrl,
        isActive: values.isActive,
      };
      if (editingCity) {
        await updateCity.mutateAsync({ id: editingCity.id, input });
        toast.success("City updated");
      } else {
        await createCity.mutateAsync({
          name: input.name,
          countryId: input.countryId,
          isPopular: input.isPopular,
          imageUrl: input.imageUrl,
        });
        toast.success("City added");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error("Could not save city", err instanceof Error ? err.message : undefined);
    }
  });

  const onSubmitCategory = categoryForm.handleSubmit(async (values) => {
    try {
      const input = { name: values.name, slug: values.slug, iconUrl: values.iconUrl, isActive: values.isActive };
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, input });
        toast.success("Category updated");
      } else {
        await createCategory.mutateAsync({ name: input.name, slug: input.slug, iconUrl: input.iconUrl });
        toast.success("Category added");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error("Could not save category", err instanceof Error ? err.message : undefined);
    }
  });

  const onSubmitBrand = brandForm.handleSubmit(async (values) => {
    try {
      const input = { name: values.name, logoUrl: values.logoUrl, isActive: values.isActive };
      if (editingBrand) {
        await updateBrand.mutateAsync({ id: editingBrand.id, input });
        toast.success("Brand updated");
      } else {
        await createBrand.mutateAsync({ name: input.name, logoUrl: input.logoUrl });
        toast.success("Brand added");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error("Could not save brand", err instanceof Error ? err.message : undefined);
    }
  });

  const toggleCountryActive = async (c: Country) => {
    try {
      if (c.isActive) {
        await deleteCountry.mutateAsync(c.id);
        toast.success("Country deactivated");
      } else {
        await updateCountry.mutateAsync({ id: c.id, input: { isActive: true } });
        toast.success("Country activated");
      }
    } catch (err) {
      toast.error("Could not update country", err instanceof Error ? err.message : undefined);
    }
  };
  const toggleCityActive = async (c: City) => {
    try {
      if (c.isActive) {
        await deleteCity.mutateAsync(c.id);
        toast.success("City deactivated");
      } else {
        await updateCity.mutateAsync({ id: c.id, input: { isActive: true } });
        toast.success("City activated");
      }
    } catch (err) {
      toast.error("Could not update city", err instanceof Error ? err.message : undefined);
    }
  };
  const toggleCategoryActive = async (c: VehicleCategory) => {
    try {
      if (c.isActive) {
        await deleteCategory.mutateAsync(c.id);
        toast.success("Category deactivated");
      } else {
        await updateCategory.mutateAsync({ id: c.id, input: { isActive: true } });
        toast.success("Category activated");
      }
    } catch (err) {
      toast.error("Could not update category", err instanceof Error ? err.message : undefined);
    }
  };
  const toggleBrandActive = async (b: VehicleBrand) => {
    try {
      if (b.isActive) {
        await deleteBrand.mutateAsync(b.id);
        toast.success("Brand deactivated");
      } else {
        await updateBrand.mutateAsync({ id: b.id, input: { isActive: true } });
        toast.success("Brand activated");
      }
    } catch (err) {
      toast.error("Could not update brand", err instanceof Error ? err.message : undefined);
    }
  };

  const currentTabLabel = TABS.find((t) => t.value === section)?.label.toLowerCase();
  const isEditing = !!(editingCountry || editingCity || editingCategory || editingBrand);
  const isSaving =
    createCountry.isPending ||
    updateCountry.isPending ||
    createCity.isPending ||
    updateCity.isPending ||
    createCategory.isPending ||
    updateCategory.isPending ||
    createBrand.isPending ||
    updateBrand.isPending;

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Catalog management</h1>
          <p className="text-sm text-primary-400">Manage countries, cities, vehicle categories, and brands.</p>
        </div>
        <Button onClick={openCreate}>
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
                {
                  header: "Status",
                  cell: (c) => <Badge tone={c.isActive ? "success" : "neutral"}>{c.isActive ? "Active" : "Inactive"}</Badge>,
                },
                {
                  header: "Actions",
                  cell: (c) => (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditCountry(c)}>
                        <Pencil size={13} /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={c.isActive ? "danger" : "secondary"}
                        onClick={() => toggleCountryActive(c)}
                      >
                        {c.isActive ? (
                          <>
                            <Ban size={13} /> Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={13} /> Activate
                          </>
                        )}
                      </Button>
                    </div>
                  ),
                },
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
                {
                  header: "Status",
                  cell: (c) => <Badge tone={c.isActive ? "success" : "neutral"}>{c.isActive ? "Active" : "Inactive"}</Badge>,
                },
                {
                  header: "Actions",
                  cell: (c) => (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditCity(c)}>
                        <Pencil size={13} /> Edit
                      </Button>
                      <Button size="sm" variant={c.isActive ? "danger" : "secondary"} onClick={() => toggleCityActive(c)}>
                        {c.isActive ? (
                          <>
                            <Ban size={13} /> Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={13} /> Activate
                          </>
                        )}
                      </Button>
                    </div>
                  ),
                },
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
                {
                  header: "Status",
                  cell: (c) => <Badge tone={c.isActive ? "success" : "neutral"}>{c.isActive ? "Active" : "Inactive"}</Badge>,
                },
                {
                  header: "Actions",
                  cell: (c) => (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditCategory(c)}>
                        <Pencil size={13} /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={c.isActive ? "danger" : "secondary"}
                        onClick={() => toggleCategoryActive(c)}
                      >
                        {c.isActive ? (
                          <>
                            <Ban size={13} /> Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={13} /> Activate
                          </>
                        )}
                      </Button>
                    </div>
                  ),
                },
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
                {
                  header: "Status",
                  cell: (b) => <Badge tone={b.isActive ? "success" : "neutral"}>{b.isActive ? "Active" : "Inactive"}</Badge>,
                },
                {
                  header: "Actions",
                  cell: (b) => (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditBrand(b)}>
                        <Pencil size={13} /> Edit
                      </Button>
                      <Button size="sm" variant={b.isActive ? "danger" : "secondary"} onClick={() => toggleBrandActive(b)}>
                        {b.isActive ? (
                          <>
                            <Ban size={13} /> Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={13} /> Activate
                          </>
                        )}
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${isEditing ? "Edit" : "Add"} ${currentTabLabel}`}
      >
        {section === "countries" && (
          <form onSubmit={onSubmitCountry} className="flex flex-col gap-4">
            <Input label="Name" error={countryForm.formState.errors.name?.message} {...countryForm.register("name")} />
            <Input
              label="Code (2-3 letters)"
              maxLength={3}
              error={countryForm.formState.errors.code?.message}
              {...countryForm.register("code")}
            />
            {editingCountry && <Checkbox label="Active" {...countryForm.register("isActive")} />}
            <Button type="submit" isLoading={isSaving} fullWidth>
              {editingCountry ? "Save changes" : "Add country"}
            </Button>
          </form>
        )}
        {section === "cities" && (
          <form onSubmit={onSubmitCity} className="flex flex-col gap-4">
            <Input label="Name" error={cityForm.formState.errors.name?.message} {...cityForm.register("name")} />
            <Select
              label="Country"
              placeholder="Select a country"
              options={(countries ?? []).map((c) => ({ value: c.id, label: c.name }))}
              error={cityForm.formState.errors.countryId?.message}
              {...cityForm.register("countryId")}
            />
            <Input label="Image URL (optional)" {...cityForm.register("imageUrl")} error={cityForm.formState.errors.imageUrl?.message} />
            <Checkbox label="Mark as popular" {...cityForm.register("isPopular")} />
            {editingCity && <Checkbox label="Active" {...cityForm.register("isActive")} />}
            <Button type="submit" isLoading={isSaving} fullWidth>
              {editingCity ? "Save changes" : "Add city"}
            </Button>
          </form>
        )}
        {section === "categories" && (
          <form onSubmit={onSubmitCategory} className="flex flex-col gap-4">
            <Input label="Name" error={categoryForm.formState.errors.name?.message} {...categoryForm.register("name")} />
            <Input
              label="Slug"
              placeholder="e.g. hatchback"
              error={categoryForm.formState.errors.slug?.message}
              {...categoryForm.register("slug")}
            />
            <Input
              label="Icon URL (optional)"
              error={categoryForm.formState.errors.iconUrl?.message}
              {...categoryForm.register("iconUrl")}
            />
            {editingCategory && <Checkbox label="Active" {...categoryForm.register("isActive")} />}
            <Button type="submit" isLoading={isSaving} fullWidth>
              {editingCategory ? "Save changes" : "Add category"}
            </Button>
          </form>
        )}
        {section === "brands" && (
          <form onSubmit={onSubmitBrand} className="flex flex-col gap-4">
            <Input label="Name" error={brandForm.formState.errors.name?.message} {...brandForm.register("name")} />
            <Input
              label="Logo URL (optional)"
              error={brandForm.formState.errors.logoUrl?.message}
              {...brandForm.register("logoUrl")}
            />
            {editingBrand && <Checkbox label="Active" {...brandForm.register("isActive")} />}
            <Button type="submit" isLoading={isSaving} fullWidth>
              {editingBrand ? "Save changes" : "Add brand"}
            </Button>
          </form>
        )}
      </Modal>
    </PageTransition>
  );
}
