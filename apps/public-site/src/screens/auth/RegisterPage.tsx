"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "@vrm/ui";
import { Car, Mail, Lock, User, Phone } from "lucide-react";
import { Button, Input, useToast, AuthLayout } from "@vrm/ui";
import { useAuth } from "@vrm/api-client";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7).max(20).optional().or(z.literal("")),
  password: z.string().min(8, "At least 8 characters"),
  referralCode: z.string().optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await registerUser({
        ...values,
        phone: values.phone || undefined,
        referralCode: values.referralCode || undefined,
        userType: "CUSTOMER",
      });
      toast.success("Account created", "Let's verify your email to get started.");
      navigate("/verify-otp?purpose=EMAIL_VERIFICATION", { replace: true });
    } catch (err) {
      toast.error("Registration failed", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Book vehicles from trusted rental partners in minutes."
      brandTagline="Your journey starts here."
      brandTitle={
        <div className="flex items-center gap-2 font-heading text-xl font-bold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">
            <Car size={20} />
          </span>
          RentWheels
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" leftIcon={<User size={16} />} error={errors.firstName?.message} {...register("firstName")} />
          <Input label="Last name" error={errors.lastName?.message} {...register("lastName")} />
        </div>
        <Input label="Email" type="email" leftIcon={<Mail size={16} />} error={errors.email?.message} {...register("email")} />
        <Input label="Phone (optional)" leftIcon={<Phone size={16} />} error={errors.phone?.message} {...register("phone")} />
        <Input label="Password" type="password" leftIcon={<Lock size={16} />} error={errors.password?.message} {...register("password")} />
        <Input label="Referral code (optional)" error={errors.referralCode?.message} {...register("referralCode")} />
        <Button type="submit" isLoading={isSubmitting} fullWidth className="mt-2">
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-primary-400">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-link hover:underline">
          Log in
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-primary-400">
        Want to list your vehicles?{" "}
        <a href="http://localhost:5174/register" className="font-medium text-link hover:underline">
          Become a rental partner
        </a>
      </p>
    </AuthLayout>
  );
}
