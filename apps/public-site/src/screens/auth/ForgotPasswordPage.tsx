"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "@vrm/ui";
import { KeyRound } from "lucide-react";
import { Button, Input, useToast, AuthLayout } from "@vrm/ui";
import { authApi } from "@vrm/api-client";

const schema = z.object({ email: z.string().email("Enter a valid email") });
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await authApi.forgotPassword(values.email);
      toast.success("Check your email", "If an account exists, a reset code has been sent.");
      navigate(`/reset-password?email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      toast.error("Something went wrong", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset code."
      brandTagline="Get back in seconds."
      brandTitle={
        <div className="flex items-center gap-2 font-heading text-xl font-bold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">
            <KeyRound size={20} />
          </span>
          RentWheels
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <Button type="submit" isLoading={isSubmitting} fullWidth>
          Send reset code
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-primary-400">
        <Link to="/login" className="font-medium text-link hover:underline">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}
