"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "@vrm/ui";
import { Car, LogOut, FileText } from "lucide-react";
import {
  useAuth,
  useMyPartnerProfile,
  useCreatePartnerProfile,
  useUpdatePartnerProfile,
  useUploadPartnerDocument,
  useSetBankDetails,
  useCities,
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

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "BUSINESS_LICENSE", label: "Business license" },
  { value: "GST_CERTIFICATE", label: "GST certificate" },
  { value: "IDENTITY_PROOF", label: "Identity proof" },
  { value: "ADDRESS_PROOF", label: "Address proof" },
  { value: "BANK_PROOF", label: "Bank proof" },
  { value: "OTHER", label: "Other" },
];

const VERIFICATION_COPY: Record<string, { tone: "warning" | "info" | "success" | "danger"; label: string; description: string }> = {
  PENDING: {
    tone: "warning",
    label: "Pending review",
    description: "Submit your documents and bank details — an admin will review your business shortly.",
  },
  UNDER_REVIEW: {
    tone: "info",
    label: "Under review",
    description: "Our team is reviewing your documents. This usually takes 1-2 business days.",
  },
  VERIFIED: {
    tone: "success",
    label: "Verified",
    description: "Your business is verified. You can now list vehicles.",
  },
  REJECTED: {
    tone: "danger",
    label: "Rejected",
    description: "Your application was rejected. Review your documents and contact support if you have questions.",
  },
};

export function OnboardingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: partner, isLoading } = useMyPartnerProfile();
  const { data: cities } = useCities();
  const createProfile = useCreatePartnerProfile();
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

  if (isLoading) return <PageSpinner />;

  const onSubmitProfile = async (values: ProfileFormValues) => {
    const input = { ...values, description: values.description || undefined };
    try {
      if (partner) {
        await updateProfile.mutateAsync(input);
        toast.success("Business details updated");
      } else {
        await createProfile.mutateAsync(input);
        toast.success("Profile created", "Now upload your documents and bank details.");
        setTab("documents");
      }
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

  const status = partner ? VERIFICATION_COPY[partner.verificationStatus] : null;

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4 dark:border-dark-border dark:bg-dark-surface">
        <div className="flex items-center gap-2 font-heading text-lg font-bold text-primary dark:text-white">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-white">
            <Car size={18} />
          </span>
          RentWheels Partner
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <LogOut size={15} /> Log out
        </Button>
      </header>

      <PageTransition>
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <h1 className="font-heading text-2xl font-bold">Welcome, {user?.firstName}</h1>
          <p className="mt-1 text-sm text-primary-400">
            Complete your business profile so customers can find and book your vehicles.
          </p>

          {status && (
            <Card className="mt-6 flex items-center gap-3 p-4">
              <Badge tone={status.tone}>{status.label}</Badge>
              <p className="text-sm text-primary-400">{status.description}</p>
            </Card>
          )}

          {partner && (
            <Tabs
              className="mt-6"
              tabs={[
                { value: "business", label: "Business details" },
                { value: "documents", label: "Documents" },
                { value: "bank", label: "Bank details" },
              ]}
              value={tab}
              onChange={setTab}
            />
          )}

          <Card className="mt-6 p-5">
            {(!partner || tab === "business") && (
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
                <Button type="submit" isLoading={isProfileSubmitting} fullWidth className="mt-2">
                  {partner ? "Save changes" : "Create business profile"}
                </Button>
              </form>
            )}

            {partner && tab === "documents" && (
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
                          <span>{DOCUMENT_TYPES.find((d) => d.value === doc.type)?.label ?? doc.type}</span>
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

            {partner && tab === "bank" && (
              <form onSubmit={handleBankSubmit(onSubmitBank)} className="flex flex-col gap-4">
                <Input label="Account holder name" {...registerBank("accountHolder", { required: true })} />
                <Input label="Account number" {...registerBank("accountNumber", { required: true })} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input label="IFSC code" {...registerBank("ifscCode", { required: true })} />
                  <Input label="Bank name" {...registerBank("bankName", { required: true })} />
                </div>
                <Input label="Branch (optional)" {...registerBank("branch")} />
                <Input label="UPI ID (optional)" placeholder="yourname@upi" {...registerBank("upiId")} />
                <Button type="submit" isLoading={isBankSubmitting} fullWidth className="mt-2">
                  Save bank details
                </Button>
              </form>
            )}
          </Card>

          {partner && (
            <div className="mt-6 flex justify-end">
              <Button onClick={() => navigate("/dashboard")}>Continue to dashboard</Button>
            </div>
          )}
        </div>
      </PageTransition>
    </div>
  );
}
