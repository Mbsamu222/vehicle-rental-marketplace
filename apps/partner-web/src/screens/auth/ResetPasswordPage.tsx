"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { useNavigate } from "@vrm/ui";
import { KeyRound } from "lucide-react";
import { Button, Input, useToast, AuthLayout } from "@vrm/ui";
import { authApi } from "@vrm/api-client";

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "Enter the 6-digit code"),
  newPassword: z.string().min(8, "At least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: searchParams.get("email") ?? "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await authApi.resetPassword(values.email, values.otp, values.newPassword);
      toast.success("Password reset", "You can now log in with your new password.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error("Reset failed", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the code we sent and choose a new password."
      brandTagline="Almost there."
      brandTitle={
        <div className="flex items-center gap-2 font-heading text-xl font-bold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">
            <KeyRound size={20} />
          </span>
          RentWheels Partner
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <Input label="Reset code" maxLength={6} error={errors.otp?.message} {...register("otp")} />
        <Input label="New password" type="password" error={errors.newPassword?.message} {...register("newPassword")} />
        <Button type="submit" isLoading={isSubmitting} fullWidth>
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}
