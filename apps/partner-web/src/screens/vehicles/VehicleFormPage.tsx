"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams } from "next/navigation";
import { Link, useNavigate } from "@vrm/ui";
import { ArrowLeft } from "lucide-react";
import {
  useVehicle,
  useCreateVehicle,
  useUpdateVehicle,
  useVehicleCategories,
  useVehicleBrands,
  useCities,
  useMyPartnerProfile,
} from "@vrm/api-client";
import { Badge, Button, Card, Input, Select, Textarea, PageSpinner, PageTransition, useToast } from "@vrm/ui";

const schema = z.object({
  categoryId: z.string().min(1, "Required"),
  brandId: z.string().min(1, "Required"),
  cityId: z.string().min(1, "Required"),
  model: z.string().min(1, "Required").max(150),
  year: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1),
  registrationNumber: z.string().min(3, "Required").max(30),
  transmission: z.enum(["MANUAL", "AUTOMATIC"]),
  fuelType: z.enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "CNG"]),
  seatingCapacity: z.coerce.number().int().min(1).max(100),
  pricePerHour: z.coerce.number().positive("Must be greater than 0"),
  pricePerDay: z.coerce.number().positive("Must be greater than 0"),
  securityDeposit: z.coerce.number().min(0).optional(),
  insuranceDetails: z.string().max(2000).optional().or(z.literal("")),
  rentalPolicies: z.string().max(4000).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export function VehicleFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const { data: vehicle, isLoading } = useVehicle(id);
  const { data: partner } = useMyPartnerProfile();
  const { data: categories } = useVehicleCategories();
  const { data: brands } = useVehicleBrands();
  const { data: cities } = useCities();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: vehicle
      ? {
          categoryId: vehicle.categoryId,
          brandId: vehicle.brandId,
          cityId: vehicle.cityId,
          model: vehicle.model,
          year: vehicle.year,
          registrationNumber: vehicle.registrationNumber,
          transmission: vehicle.transmission,
          fuelType: vehicle.fuelType,
          seatingCapacity: vehicle.seatingCapacity,
          pricePerHour: Number(vehicle.pricePerHour),
          pricePerDay: Number(vehicle.pricePerDay),
          securityDeposit: Number(vehicle.securityDeposit),
          insuranceDetails: vehicle.insuranceDetails ?? "",
          rentalPolicies: vehicle.rentalPolicies ?? "",
        }
      : undefined,
  });

  if (isEdit && isLoading) return <PageSpinner />;

  // Creating a new listing requires an admin-verified business — mirrors the check the
  // backend enforces in vehicles.controller.ts `createVehicle`.
  if (!isEdit && partner && partner.verificationStatus !== "VERIFIED") {
    return (
      <PageTransition>
        <Card className="mx-auto max-w-lg p-6 text-center">
          <Badge tone="warning" className="mb-3">
            {partner.verificationStatus.replace(/_/g, " ")}
          </Badge>
          <h1 className="font-heading text-xl font-bold">Verification required</h1>
          <p className="mt-2 text-sm text-primary-400">
            Your business must be verified by an admin before you can list vehicles.
          </p>
          <Link to="/business-profile">
            <Button className="mt-4">Go to business profile</Button>
          </Link>
        </Card>
      </PageTransition>
    );
  }

  const onSubmit = async (values: FormValues) => {
    const input = {
      ...values,
      securityDeposit: values.securityDeposit ?? 0,
      insuranceDetails: values.insuranceDetails || undefined,
      rentalPolicies: values.rentalPolicies || undefined,
    };
    try {
      if (isEdit && id) {
        await updateVehicle.mutateAsync({ id, input });
        toast.success("Vehicle updated", "Changes will need admin re-approval.");
        navigate(`/vehicles/${id}`);
      } else {
        const created = await createVehicle.mutateAsync(input);
        toast.success("Vehicle created", "It's now pending admin approval.");
        navigate(`/vehicles/${created.id}`);
      }
    } catch (err) {
      toast.error("Could not save vehicle", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <PageTransition>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-primary-400 hover:text-primary"
      >
        <ArrowLeft size={15} /> Back
      </button>
      <h1 className="mb-6 font-heading text-2xl font-bold">{isEdit ? "Edit vehicle" : "Add a vehicle"}</h1>

      <Card className="max-w-2xl p-5">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Category"
              placeholder="Select category"
              options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
              error={errors.categoryId?.message}
              {...register("categoryId")}
            />
            <Select
              label="Brand"
              placeholder="Select brand"
              options={(brands ?? []).map((b) => ({ value: b.id, label: b.name }))}
              error={errors.brandId?.message}
              {...register("brandId")}
            />
          </div>
          <Select
            label="City"
            placeholder="Select city"
            options={(cities ?? []).map((c) => ({ value: c.id, label: c.name }))}
            error={errors.cityId?.message}
            {...register("cityId")}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Model" error={errors.model?.message} {...register("model")} />
            <Input label="Year" type="number" error={errors.year?.message} {...register("year")} />
          </div>
          <Input label="Registration number" error={errors.registrationNumber?.message} {...register("registrationNumber")} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Transmission"
              options={[
                { value: "MANUAL", label: "Manual" },
                { value: "AUTOMATIC", label: "Automatic" },
              ]}
              error={errors.transmission?.message}
              {...register("transmission")}
            />
            <Select
              label="Fuel type"
              options={[
                { value: "PETROL", label: "Petrol" },
                { value: "DIESEL", label: "Diesel" },
                { value: "ELECTRIC", label: "Electric" },
                { value: "HYBRID", label: "Hybrid" },
                { value: "CNG", label: "CNG" },
              ]}
              error={errors.fuelType?.message}
              {...register("fuelType")}
            />
          </div>
          <Input label="Seating capacity" type="number" error={errors.seatingCapacity?.message} {...register("seatingCapacity")} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input label="Price / hour (₹)" type="number" step="0.01" error={errors.pricePerHour?.message} {...register("pricePerHour")} />
            <Input label="Price / day (₹)" type="number" step="0.01" error={errors.pricePerDay?.message} {...register("pricePerDay")} />
            <Input label="Security deposit (₹)" type="number" step="0.01" {...register("securityDeposit")} />
          </div>
          <Textarea label="Insurance details (optional)" {...register("insuranceDetails")} />
          <Textarea label="Rental policies (optional)" {...register("rentalPolicies")} />
          <Button type="submit" isLoading={isSubmitting} fullWidth className="mt-2">
            {isEdit ? "Save changes" : "Create vehicle"}
          </Button>
        </form>
      </Card>
    </PageTransition>
  );
}
