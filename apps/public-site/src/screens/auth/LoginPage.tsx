"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { Car, Mail, Lock, Smartphone } from "lucide-react";
import { Button, Input, useToast, AuthLayout, Link, useNavigate } from "@vrm/ui";
import {
  useAuth,
  authApi,
  createRecaptchaVerifier,
  startPhoneSignIn,
  confirmPhoneCode,
  type ConfirmationResult,
} from "@vrm/api-client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{7,15}$/;

const identifierSchema = z.object({ identifier: z.string().min(1, "Enter your email or phone number") });
const passwordSchema = z.object({ password: z.string().min(1, "Password is required") });
const otpSchema = z.object({ code: z.string().length(6, "Enter the 6-digit code") });

type Step = "identifier" | "password" | "otp";

export function LoginPage() {
  const { loginWithEmail, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const toast = useToast();
  const redirectTo = searchParams.get("redirect") ?? "/account";

  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const idForm = useForm<{ identifier: string }>({ resolver: zodResolver(identifierSchema) });
  const pwForm = useForm<{ password: string }>({ resolver: zodResolver(passwordSchema) });
  const otpForm = useForm<{ code: string }>({ resolver: zodResolver(otpSchema) });

  const onIdentifierSubmit = async ({ identifier: value }: { identifier: string }) => {
    const trimmed = value.trim();

    if (EMAIL_RE.test(trimmed)) {
      setIdentifier(trimmed);
      setStep("password");
      return;
    }

    if (!PHONE_RE.test(trimmed)) {
      idForm.setError("identifier", {
        message: "Enter a valid email, or a phone number with country code (e.g. +14155550123)",
      });
      return;
    }

    setIsResolving(true);
    try {
      const { exists } = await authApi.lookup(trimmed);
      if (!exists) {
        idForm.setError("identifier", { message: "No account found for this phone number" });
        return;
      }
      const verifier = createRecaptchaVerifier("recaptcha-container-login");
      const result = await startPhoneSignIn(trimmed, verifier);
      setConfirmation(result);
      setIdentifier(trimmed);
      setStep("otp");
    } catch (err) {
      toast.error("Something went wrong", err instanceof Error ? err.message : undefined);
    } finally {
      setIsResolving(false);
    }
  };

  const onPasswordSubmit = async ({ password }: { password: string }) => {
    try {
      await loginWithEmail(identifier, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error("Login failed", err instanceof Error ? err.message : undefined);
    }
  };

  const onOtpSubmit = async ({ code }: { code: string }) => {
    if (!confirmation) return;
    try {
      await confirmPhoneCode(confirmation, code);
    } catch (err) {
      toast.error("Verification failed", err instanceof Error ? err.message : undefined);
      return;
    }

    const profile = await refresh();
    if (!profile) {
      await authApi.discardUnlinked().catch(() => {});
      await logout();
      toast.error("No account found for this phone number");
      setStep("identifier");
      return;
    }
    navigate(redirectTo, { replace: true });
  };

  return (
    <AuthLayout
      title={step === "otp" ? "Enter the code" : step === "password" ? "Welcome back" : "Log in or sign up"}
      subtitle={
        step === "otp"
          ? `We sent a 6-digit code to ${identifier}.`
          : step === "password"
            ? `Continue as ${identifier}.`
            : "Use your email or phone number to continue."
      }
      brandTagline="Rent smarter. Drive further."
      brandTitle={
        <div className="flex items-center gap-2 font-heading text-xl font-bold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">
            <Car size={20} />
          </span>
          RentWheels
        </div>
      }
    >
      {step === "identifier" && (
        <form onSubmit={idForm.handleSubmit(onIdentifierSubmit)} className="flex flex-col gap-4">
          <Input
            label="Email or phone number"
            leftIcon={<Mail size={16} />}
            placeholder="you@example.com or +14155550123"
            error={idForm.formState.errors.identifier?.message}
            {...idForm.register("identifier")}
          />
          <Button type="submit" isLoading={isResolving} fullWidth className="mt-2">
            Continue
          </Button>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={pwForm.handleSubmit(onPasswordSubmit)} className="flex flex-col gap-4">
          <Input
            label="Password"
            type="password"
            leftIcon={<Lock size={16} />}
            error={pwForm.formState.errors.password?.message}
            {...pwForm.register("password")}
          />
          <Link to="/forgot-password" className="-mt-2 inline-block text-xs font-medium text-link hover:underline">
            Forgot password?
          </Link>
          <Button type="submit" isLoading={pwForm.formState.isSubmitting} fullWidth>
            Log in
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={() => setStep("identifier")}>
            Use a different email or phone
          </Button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="flex flex-col gap-4">
          <Input
            label="Verification code"
            leftIcon={<Smartphone size={16} />}
            maxLength={6}
            inputMode="numeric"
            error={otpForm.formState.errors.code?.message}
            {...otpForm.register("code")}
          />
          <Button type="submit" isLoading={otpForm.formState.isSubmitting} fullWidth>
            Verify and log in
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={() => setStep("identifier")}>
            Use a different email or phone
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-primary-400">
        New to RentWheels?{" "}
        <Link to="/register" className="font-medium text-link hover:underline">
          Create an account
        </Link>
      </p>

      <div id="recaptcha-container-login" />
    </AuthLayout>
  );
}
