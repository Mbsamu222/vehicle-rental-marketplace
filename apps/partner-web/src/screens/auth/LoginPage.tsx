"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { Car, Mail, Lock } from "lucide-react";
import { Button, Input, useToast, AuthLayout, Link, useNavigate } from "@vrm/ui";
import { useAuth } from "@vrm/api-client";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values.email, values.password);
      const redirectTo = searchParams.get("redirect") ?? "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error("Login failed", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <AuthLayout
      title="Welcome back, partner"
      subtitle="Log in to manage your fleet and bookings."
      brandTagline="Grow your rental business."
      brandTitle={
        <div className="flex items-center gap-2 font-heading text-xl font-bold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">
            <Car size={20} />
          </span>
          RentWheels Partner
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Email" type="email" leftIcon={<Mail size={16} />} error={errors.email?.message} {...register("email")} />
        <div>
          <Input
            label="Password"
            type="password"
            leftIcon={<Lock size={16} />}
            error={errors.password?.message}
            {...register("password")}
          />
          <Link to="/forgot-password" className="mt-2 inline-block text-xs font-medium text-link hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" isLoading={isSubmitting} fullWidth className="mt-2">
          Log in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-primary-400">
        New partner?{" "}
        <Link to="/register" className="font-medium text-link hover:underline">
          Create a partner account
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-primary-400">
        Looking to rent a vehicle instead?{" "}
        <a href="http://localhost:5176/register" className="font-medium text-link hover:underline">
          Go to the customer site
        </a>
      </p>
    </AuthLayout>
  );
}
