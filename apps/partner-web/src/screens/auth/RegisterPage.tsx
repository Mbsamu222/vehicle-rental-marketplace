"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "@vrm/ui";
import { Car, Mail, Lock, User, Phone, Smartphone } from "lucide-react";
import { Button, Input, useToast, AuthLayout } from "@vrm/ui";
import {
  useAuth,
  createRecaptchaVerifier,
  linkPhoneToCurrentUser,
  confirmPhoneCode,
  type ConfirmationResult,
} from "@vrm/api-client";

const schema = z
  .object({
    firstName: z.string().min(1, "Required"),
    lastName: z.string().min(1, "Required"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(7).max(20).optional().or(z.literal("")),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    referralCode: z.string().optional().or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

const otpSchema = z.object({ code: z.string().length(6, "Enter the 6-digit code") });
type OtpValues = z.infer<typeof otpSchema>;

export function RegisterPage() {
  const { registerWithEmail, completeSync } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState<"form" | "phone-otp">("form");
  const [pendingPhone, setPendingPhone] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const otpForm = useForm<OtpValues>({ resolver: zodResolver(otpSchema) });

  const finish = () => {
    toast.success("Account created", "Let's list your first vehicle.");
    navigate("/dashboard", { replace: true });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await registerWithEmail(values.email, values.password, {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
        referralCode: values.referralCode || undefined,
        userType: "RENTAL_PARTNER",
      });

      if (values.phone) {
        const verifier = createRecaptchaVerifier("recaptcha-container-register");
        const result = await linkPhoneToCurrentUser(values.phone, verifier);
        setPendingPhone(values.phone);
        setConfirmation(result);
        setStep("phone-otp");
        return;
      }

      finish();
    } catch (err) {
      toast.error("Registration failed", err instanceof Error ? err.message : undefined);
    }
  };

  const onVerifyPhone = async ({ code }: OtpValues) => {
    if (!confirmation) return;
    try {
      await confirmPhoneCode(confirmation, code);
      await completeSync({ phone: pendingPhone });
    } catch (err) {
      toast.error("Phone verification failed", err instanceof Error ? err.message : undefined);
      return;
    }
    finish();
  };

  return (
    <AuthLayout
      title={step === "phone-otp" ? "Verify your phone" : "List your vehicles"}
      subtitle={
        step === "phone-otp"
          ? `Enter the code we sent to ${pendingPhone} so you can log in by phone too.`
          : "Create a partner account and start earning from your fleet."
      }
      brandTagline="Your fleet, your business."
      brandTitle={
        <div className="flex items-center gap-2 font-heading text-xl font-bold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">
            <Car size={20} />
          </span>
          RentWheels Partner
        </div>
      }
    >
      {step === "form" && (
        <>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First name" leftIcon={<User size={16} />} error={errors.firstName?.message} {...register("firstName")} />
              <Input label="Last name" error={errors.lastName?.message} {...register("lastName")} />
            </div>
            <Input label="Email" type="email" leftIcon={<Mail size={16} />} error={errors.email?.message} {...register("email")} />
            <Input
              label="Phone (optional)"
              hint="Add a phone number to also be able to log in with it later."
              leftIcon={<Phone size={16} />}
              error={errors.phone?.message}
              {...register("phone")}
            />
            <Input label="Password" type="password" leftIcon={<Lock size={16} />} error={errors.password?.message} {...register("password")} />
            <Input
              label="Confirm password"
              type="password"
              leftIcon={<Lock size={16} />}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
            <Input label="Referral code (optional)" error={errors.referralCode?.message} {...register("referralCode")} />
            <Button type="submit" isLoading={isSubmitting} fullWidth className="mt-2">
              Create partner account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-primary-400">
            Already a partner?{" "}
            <Link to="/login" className="font-medium text-link hover:underline">
              Log in
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-primary-400">
            Looking to book a vehicle instead?{" "}
            <a href="http://localhost:5176/register" className="font-medium text-link hover:underline">
              Sign up as a customer
            </a>
          </p>
        </>
      )}

      {step === "phone-otp" && (
        <form onSubmit={otpForm.handleSubmit(onVerifyPhone)} className="flex flex-col gap-4">
          <Input
            label="Verification code"
            leftIcon={<Smartphone size={16} />}
            maxLength={6}
            inputMode="numeric"
            error={otpForm.formState.errors.code?.message}
            {...otpForm.register("code")}
          />
          <Button type="submit" isLoading={otpForm.formState.isSubmitting} fullWidth>
            Verify phone
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={finish}>
            Skip for now
          </Button>
        </form>
      )}

      <div id="recaptcha-container-register" />
    </AuthLayout>
  );
}
