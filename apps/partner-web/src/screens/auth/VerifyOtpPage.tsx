"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { useNavigate } from "@vrm/ui";
import { ShieldCheck } from "lucide-react";
import { Button, Input, useToast, AuthLayout } from "@vrm/ui";
import { authApi, useAuth } from "@vrm/api-client";

const schema = z.object({ otp: z.string().length(6, "Enter the 6-digit code") });
type FormValues = z.infer<typeof schema>;

export function VerifyOtpPage() {
  const searchParams = useSearchParams();
  const purpose = (searchParams.get("purpose") as "EMAIL_VERIFICATION" | "PHONE_VERIFICATION") ?? "EMAIL_VERIFICATION";
  const { setUser, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [devCode, setDevCode] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    authApi.requestOtp(purpose).then((res) => {
      if (res.code) {
        setDevCode(res.code);
        setValue("otp", res.code);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purpose]);

  const onSubmit = async (values: FormValues) => {
    try {
      const updated = await authApi.verifyOtp(values.otp, purpose);
      setUser(updated);
      toast.success("Verified", "Your account is ready to go.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error("Verification failed", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <AuthLayout
      title="Verify your account"
      subtitle={`We sent a 6-digit code to confirm your ${purpose === "EMAIL_VERIFICATION" ? "email" : "phone"}.`}
      brandTagline="One last step."
      brandTitle={
        <div className="flex items-center gap-2 font-heading text-xl font-bold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">
            <ShieldCheck size={20} />
          </span>
          RentWheels Partner
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="6-digit code"
          maxLength={6}
          inputMode="numeric"
          error={errors.otp?.message}
          {...register("otp")}
        />
        {devCode && (
          <p className="rounded-lg bg-secondary-50 px-3 py-2 text-xs text-secondary dark:bg-secondary-500/10">
            Dev mode: code auto-filled ({devCode}) — no email provider configured yet.
          </p>
        )}
        <Button type="submit" isLoading={isSubmitting} fullWidth>
          Verify
        </Button>
        <Button type="button" variant="ghost" fullWidth onClick={() => navigate(user ? "/dashboard" : "/login")}>
          Skip for now
        </Button>
      </form>
    </AuthLayout>
  );
}
