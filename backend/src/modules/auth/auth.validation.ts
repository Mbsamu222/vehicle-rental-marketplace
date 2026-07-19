import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(20).optional(),
  password: z.string().min(8).max(128),
  userType: z.enum(["CUSTOMER", "RENTAL_PARTNER"]).default("CUSTOMER"),
  referralCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const verifyOtpSchema = z.object({
  otp: z.string().length(6),
  purpose: z.enum(["EMAIL_VERIFICATION", "PHONE_VERIFICATION"]),
});

export const requestOtpSchema = z.object({
  purpose: z.enum(["EMAIL_VERIFICATION", "PHONE_VERIFICATION"]),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8).max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
