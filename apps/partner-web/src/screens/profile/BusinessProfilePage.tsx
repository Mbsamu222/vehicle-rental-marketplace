"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText } from "lucide-react";
import {
  useMyPartnerProfile,
  useUpdatePartnerProfile,
  useUploadPartnerDocument,
  useSetBankDetails,
  useCities,
  changePassword,
  type DocumentType,
} from "@vrm/api-client";
import {
  Badge,
  Button,
  Card,
  Input,
  MapPicker,
  Select,
  Textarea,
  Tabs,
  FileUpload,
  PageSpinner,
  PageTransition,
  useToast,
  EmptyState,
} from "@vrm/ui";

const profileSchema = z.object({
  businessName: z.string().min(1, "Required"),
  businessEmail: z.string().email("Enter a valid email"),
  businessPhone: z.string().min(7).max(20),
  cityId: z.string().min(1, "Required"),
  address: z.string().min(1, "Required"),
  description: z.string().max(2000).optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const bankSchema = z.object({
  accountHolder: z.string().min(1, "Required"),
  accountNumber: z.string().min(4).max(34),
  ifscCode: z.string().min(4).max(20),
  bankName: z.string().min(1, "Required"),
  branch: z.string().optional().or(z.literal("")),
  upiId: z.string().optional().or(z.literal("")),
});
type BankFormValues = z.infer<typeof bankSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(8, "At least 8 characters"),
});
type PasswordFormValues = z.infer<typeof passwordSchema>;

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "BUSINESS_LICENSE", label: "Business license" },
  { value: "GST_CERTIFICATE", label: "GST certificate" },
  { value: "IDENTITY_PROOF", label: "Identity proof" },
  { value: "ADDRESS_PROOF", label: "Address proof" },
  { value: "BANK_PROOF", label: "Bank proof" },
  { value: "OTHER", label: "Other" },
];

const VERIFICATION_TONE: Record<string, "warning" | "info" | "success" | "danger"> = {
  PENDING: "warning",
  UNDER_REVIEW: "info",
  VERIFIED: "success",
  REJECTED: "danger",
};

export function BusinessProfilePage() {
  const toast = useToast();
  const { data: partner, isLoading } = useMyPartnerProfile();
  const { data: cities } = useCities();
  const updateProfile = useUpdatePartnerProfile();
  const uploadDocument = useUploadPartnerDocument();
  const setBankDetails = useSetBankDetails();
  const [tab, setTab] = useState("business");
  const [docType, setDocType] = useState<DocumentType>("BUSINESS_LICENSE");
  const [docFiles, setDocFiles] = useState<string[]>([]);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    watch: watchProfile,
    setValue: setProfileValue,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: partner
      ? {
          businessName: partner.businessName,
          businessEmail: partner.businessEmail,
          businessPhone: partner.businessPhone,
          cityId: partner.cityId,
          address: partner.address,
          description: partner.description ?? "",
          latitude: partner.latitude ?? undefined,
          longitude: partner.longitude ?? undefined,
        }
      : undefined,
  });

  const profileCityId = watchProfile("cityId");
  const profileLatitude = watchProfile("latitude");
  const profileLongitude = watchProfile("longitude");
  const profileCity = cities?.find((c) => c.id === profileCityId);
  const profileCityCenter =
    profileCity?.latitude != null && profileCity?.longitude != null
      ? { lat: profileCity.latitude, lng: profileCity.longitude }
      : undefined;

  const {
    register: registerBank,
    handleSubmit: handleBankSubmit,
    formState: { isSubmitting: isBankSubmitting },
  } = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema),
    values: partner?.bankDetails
      ? {
          accountHolder: partner.bankDetails.accountHolder,
          accountNumber: partner.bankDetails.accountNumber,
          ifscCode: partner.bankDetails.ifscCode,
          bankName: partner.bankDetails.bankName,
          branch: partner.bankDetails.branch ?? "",
          upiId: partner.bankDetails.upiId ?? "",
        }
      : undefined,
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  if (isLoading || !partner) return <PageSpinner />;

  const onSubmitProfile = async (values: ProfileFormValues) => {
    try {
      await updateProfile.mutateAsync({ ...values, description: values.description || undefined });
      toast.success("Business details updated");
    } catch (err) {
      toast.error("Could not save profile", err instanceof Error ? err.message : undefined);
    }
  };

  const onUploadDocument = async () => {
    if (!docFiles[0]) {
      toast.error("Choose a file first");
      return;
    }
    try {
      await uploadDocument.mutateAsync({ type: docType, fileUrl: docFiles[0] });
      toast.success("Document uploaded");
      setDocFiles([]);
    } catch (err) {
      toast.error("Upload failed", err instanceof Error ? err.message : undefined);
    }
  };

  const onSubmitBank = async (values: BankFormValues) => {
    try {
      await setBankDetails.mutateAsync({
        ...values,
        branch: values.branch || undefined,
        upiId: values.upiId || undefined,
      });
      toast.success("Bank details saved");
    } catch (err) {
      toast.error("Could not save bank details", err instanceof Error ? err.message : undefined);
    }
  };

  const onSubmitPassword = async (values: PasswordFormValues) => {
    try {
      await changePassword(values.currentPassword, values.newPassword);
      toast.success("Password changed");
      resetPassword();
    } catch (err) {
      toast.error("Could not change password", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <PageTransition>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Business profile</h1>
          <p className="text-sm text-primary-400">Manage your business details, documents, and account.</p>
        </div>
        <Badge tone={VERIFICATION_TONE[partner.verificationStatus] ?? "neutral"}>
          {partner.verificationStatus.replace(/_/g, " ")}
        </Badge>
      </div>

      <Tabs
        className="mb-6"
        tabs={[
          { value: "business", label: "Business details" },
          { value: "documents", label: "Documents" },
          { value: "bank", label: "Bank details" },
          { value: "password", label: "Password" },
        ]}
        value={tab}
        onChange={setTab}
      />

      <Card className="max-w-2xl p-5">
        {tab === "business" && (
          <form onSubmit={handleProfileSubmit(onSubmitProfile)} className="flex flex-col gap-4">
            <Input label="Business name" error={profileErrors.businessName?.message} {...registerProfile("businessName")} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Business email"
                type="email"
                error={profileErrors.businessEmail?.message}
                {...registerProfile("businessEmail")}
              />
              <Input label="Business phone" error={profileErrors.businessPhone?.message} {...registerProfile("businessPhone")} />
            </div>
            <Select
              label="City"
              placeholder="Select a city"
              options={(cities ?? []).map((c) => ({ value: c.id, label: c.name }))}
              error={profileErrors.cityId?.message}
              {...registerProfile("cityId")}
            />
            <Input label="Address" error={profileErrors.address?.message} {...registerProfile("address")} />
            <MapPicker
              label="Business location on map (optional)"
              hint="Search an address or drag the pin to pinpoint your business location."
              value={profileLatitude != null && profileLongitude != null ? { lat: profileLatitude, lng: profileLongitude } : null}
              onChange={(val) => {
                setProfileValue("latitude", val?.lat, { shouldDirty: true });
                setProfileValue("longitude", val?.lng, { shouldDirty: true });
              }}
              defaultCenter={profileCityCenter}
            />
            <Textarea label="Description (optional)" {...registerProfile("description")} />
            <Button type="submit" isLoading={isProfileSubmitting} className="w-fit">
              Save changes
            </Button>
          </form>
        )}

        {tab === "documents" && (
          <div className="flex flex-col gap-5">
            <Select
              label="Document type"
              options={DOCUMENT_TYPES}
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
            />
            <FileUpload label="Upload document" value={docFiles} onChange={setDocFiles} accept="image/*,.pdf" />
            <Button onClick={onUploadDocument} isLoading={uploadDocument.isPending} className="w-fit">
              <FileText size={15} /> Upload document
            </Button>

            <div>
              <p className="mb-2 text-sm font-semibold">Uploaded documents</p>
              {!partner.documents?.length ? (
                <EmptyState icon={<FileText size={22} />} title="No documents uploaded yet" />
              ) : (
                <div className="flex flex-col gap-2">
                  {partner.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-xl border border-border p-3 text-sm dark:border-dark-border"
                    >
                      <div>
                        <p>{DOCUMENT_TYPES.find((d) => d.value === doc.type)?.label ?? doc.type}</p>
                        {doc.rejectionReason && doc.status === "REJECTED" && (
                          <p className="text-xs text-danger">{doc.rejectionReason}</p>
                        )}
                      </div>
                      <Badge tone={doc.status === "APPROVED" ? "success" : doc.status === "REJECTED" ? "danger" : "warning"}>
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "bank" && (
          <form onSubmit={handleBankSubmit(onSubmitBank)} className="flex flex-col gap-4">
            <Input label="Account holder name" {...registerBank("accountHolder", { required: true })} />
            <Input label="Account number" {...registerBank("accountNumber", { required: true })} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="IFSC code" {...registerBank("ifscCode", { required: true })} />
              <Input label="Bank name" {...registerBank("bankName", { required: true })} />
            </div>
            <Input label="Branch (optional)" {...registerBank("branch")} />
            <Input label="UPI ID (optional)" placeholder="yourname@upi" {...registerBank("upiId")} />
            <Button type="submit" isLoading={isBankSubmitting} className="w-fit">
              Save bank details
            </Button>
          </form>
        )}

        {tab === "password" && (
          <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="flex flex-col gap-4">
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
            <Button type="submit" isLoading={isPasswordSubmitting} className="w-fit">
              Update password
            </Button>
          </form>
        )}
      </Card>
    </PageTransition>
  );
}
