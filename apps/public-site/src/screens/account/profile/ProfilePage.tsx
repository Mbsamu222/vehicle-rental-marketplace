"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, MapPin } from "lucide-react";
import {
  authApi,
  useAuth,
  useUpdateProfile,
  useDrivingLicenses,
  useAddDrivingLicense,
  useSavedLocations,
  useAddSavedLocation,
  useDeleteSavedLocation,
  useCities,
} from "@vrm/api-client";
import { Badge, Button, Card, Input, Select, Tabs, Modal, FileUpload, useToast, EmptyState } from "@vrm/ui";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(8, "At least 8 characters"),
});
type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const [tab, setTab] = useState("details");
  const { user, refresh } = useAuth();
  const updateProfile = useUpdateProfile();
  const { data: licenses } = useDrivingLicenses();
  const addLicense = useAddDrivingLicense();
  const { data: locations } = useSavedLocations();
  const addLocation = useAddSavedLocation();
  const deleteLocation = useDeleteSavedLocation();
  const { data: cities } = useCities();
  const toast = useToast();

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { firstName: user?.firstName, lastName: user?.lastName, phone: user?.phone ?? "" },
  });

  const onSaveProfile = handleSubmit(async (values) => {
    try {
      await updateProfile.mutateAsync({ ...values, phone: values.phone || undefined });
      await refresh();
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Update failed", err instanceof Error ? err.message : undefined);
    }
  });

  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [licenseImages, setLicenseImages] = useState<string[]>([]);
  const { register: registerLicense, handleSubmit: handleLicenseSubmit, reset: resetLicense } = useForm<{
    licenseNumber: string;
    expiryDate: string;
  }>();

  const onAddLicense = handleLicenseSubmit(async (values) => {
    if (!licenseImages[0]) return toast.error("Upload a license photo");
    try {
      await addLicense.mutateAsync({
        licenseNumber: values.licenseNumber,
        frontImageUrl: licenseImages[0],
        backImageUrl: licenseImages[1],
        expiryDate: new Date(values.expiryDate).toISOString(),
      });
      toast.success("License added");
      setLicenseModalOpen(false);
      setLicenseImages([]);
      resetLicense();
    } catch (err) {
      toast.error("Could not add license", err instanceof Error ? err.message : undefined);
    }
  });

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const { register: registerLocation, handleSubmit: handleLocationSubmit, reset: resetLocation } = useForm<{
    label: string;
    address: string;
    cityId: string;
  }>();

  const onAddLocation = handleLocationSubmit(async (values) => {
    try {
      await addLocation.mutateAsync(values);
      toast.success("Location saved");
      setLocationModalOpen(false);
      resetLocation();
    } catch (err) {
      toast.error("Could not save location", err instanceof Error ? err.message : undefined);
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
  } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  const onChangePassword = handlePasswordSubmit(async (values) => {
    try {
      await authApi.changePassword(values.currentPassword, values.newPassword);
      toast.success("Password changed");
      resetPassword();
    } catch (err) {
      toast.error("Could not change password", err instanceof Error ? err.message : undefined);
    }
  });

  return (
    <>
      <h1 className="mb-6 font-heading text-2xl font-bold">Profile & Settings</h1>

      <Tabs
        tabs={[
          { value: "details", label: "Details" },
          { value: "licenses", label: "Driving licenses" },
          { value: "locations", label: "Saved locations" },
          { value: "security", label: "Security" },
        ]}
        value={tab}
        onChange={setTab}
        className="mb-6"
      />

      {tab === "details" && (
        <Card className="max-w-lg p-5">
          <form onSubmit={onSaveProfile} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First name" {...register("firstName", { required: true })} />
              <Input label="Last name" {...register("lastName", { required: true })} />
            </div>
            <Input label="Email" value={user?.email} disabled />
            <Input label="Phone" {...register("phone")} />
            <Button type="submit" isLoading={isSubmitting} className="w-fit">
              Save changes
            </Button>
          </form>
        </Card>
      )}

      {tab === "licenses" && (
        <div>
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={() => setLicenseModalOpen(true)}>
              <Plus size={15} /> Add license
            </Button>
          </div>
          {!licenses?.length ? (
            <EmptyState title="No driving licenses" description="Add one before booking your first vehicle." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {licenses.map((l) => (
                <Card key={l.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{l.licenseNumber}</p>
                    <Badge tone={l.status === "VERIFIED" ? "success" : l.status === "REJECTED" ? "danger" : "warning"}>{l.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-primary-400">Expires {new Date(l.expiryDate).toLocaleDateString()}</p>
                  {l.rejectionReason && <p className="mt-1 text-xs text-danger">{l.rejectionReason}</p>}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "locations" && (
        <div>
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={() => setLocationModalOpen(true)}>
              <Plus size={15} /> Add location
            </Button>
          </div>
          {!locations?.length ? (
            <EmptyState icon={<MapPin size={26} />} title="No saved locations" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {locations.map((loc) => (
                <Card key={loc.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{loc.label}</p>
                    <p className="text-xs text-primary-400">{loc.address}</p>
                  </div>
                  <button onClick={() => deleteLocation.mutate(loc.id)} className="text-danger">
                    <Trash2 size={16} />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "security" && (
        <Card className="max-w-md p-5">
          <h3 className="mb-4 font-heading font-semibold">Change password</h3>
          <form onSubmit={onChangePassword} className="flex flex-col gap-4">
            <Input
              label="Current password"
              type="password"
              error={passwordErrors.currentPassword?.message}
              {...registerPassword("currentPassword")}
            />
            <Input
              label="New password"
              type="password"
              error={passwordErrors.newPassword?.message}
              {...registerPassword("newPassword")}
            />
            <Button type="submit" isLoading={isSubmittingPassword} className="w-fit">
              Update password
            </Button>
          </form>
        </Card>
      )}

      <Modal open={licenseModalOpen} onClose={() => setLicenseModalOpen(false)} title="Add driving license">
        <form onSubmit={onAddLicense} className="flex flex-col gap-4">
          <Input label="License number" {...registerLicense("licenseNumber", { required: true })} />
          <Input label="Expiry date" type="date" {...registerLicense("expiryDate", { required: true })} />
          <FileUpload label="License photo" value={licenseImages} onChange={setLicenseImages} />
          <Button type="submit" fullWidth>
            Submit
          </Button>
        </form>
      </Modal>

      <Modal open={locationModalOpen} onClose={() => setLocationModalOpen(false)} title="Add saved location">
        <form onSubmit={onAddLocation} className="flex flex-col gap-4">
          <Input label="Label" placeholder="Home, Office…" {...registerLocation("label", { required: true })} />
          <Select
            label="City"
            placeholder="Select a city"
            options={(cities ?? []).map((c) => ({ value: c.id, label: c.name }))}
            {...registerLocation("cityId", { required: true })}
          />
          <Input label="Address" {...registerLocation("address", { required: true })} />
          <Button type="submit" fullWidth>
            Save location
          </Button>
        </form>
      </Modal>
    </>
  );
}
