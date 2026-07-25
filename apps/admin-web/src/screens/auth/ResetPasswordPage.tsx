"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { useNavigate } from "@vrm/ui";
import { KeyRound } from "lucide-react";
import { Button, Input, useToast, AuthLayout, PageSpinner } from "@vrm/ui";
import { verifyPasswordResetCode, confirmPasswordReset } from "@vrm/api-client";

const schema = z
  .object({
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode") ?? "";
  const navigate = useNavigate();
  const toast = useToast();
  const [status, setStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [email, setEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!oobCode) {
      setStatus("invalid");
      return;
    }
    verifyPasswordResetCode(oobCode)
      .then((verifiedEmail) => {
        setEmail(verifiedEmail);
        setStatus("valid");
      })
      .catch(() => setStatus("invalid"));
  }, [oobCode]);

  const onSubmit = async (values: FormValues) => {
    try {
      await confirmPasswordReset(oobCode, values.newPassword);
      toast.success("Password reset", "You can now log in with your new password.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error("Reset failed", err instanceof Error ? err.message : undefined);
    }
  };

  const brandTitle = (
    <div className="flex items-center gap-2 font-heading text-xl font-bold">
      <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">
        <KeyRound size={20} />
      </span>
      RentWheels Admin
    </div>
  );

  if (status === "checking") return <PageSpinner />;

  if (status === "invalid") {
    return (
      <AuthLayout title="Link expired" subtitle="This password reset link is invalid or has expired." brandTagline="Almost there." brandTitle={brandTitle}>
        <Button fullWidth onClick={() => navigate("/forgot-password")}>
          Request a new link
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle={`Choose a new password for ${email}.`} brandTagline="Almost there." brandTitle={brandTitle}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="New password" type="password" error={errors.newPassword?.message} {...register("newPassword")} />
        <Input label="Confirm new password" type="password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        <Button type="submit" isLoading={isSubmitting} fullWidth>
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}
