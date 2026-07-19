import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { comparePassword, hashPassword } from "../../utils/password";
import { generateOtp, generateToken, hashToken } from "../../utils/otp";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { getUserPermissions } from "../../utils/permissions";
import type { UserType } from "@prisma/client";

const OTP_TTL_MINUTES = 10;
const REFRESH_TTL_DAYS = 30;

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  userType: "CUSTOMER" | "RENTAL_PARTNER";
  referralCode?: string;
}

async function issueTokenPair(userId: string, userType: UserType) {
  const permissions = await getUserPermissions(userId, userType);
  const accessToken = signAccessToken({ sub: userId, userType, permissions });

  const rawRefresh = generateToken(48);
  const tokenId = generateToken(16);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(`${tokenId}.${rawRefresh}`),
      expiresAt,
    },
  });

  const refreshToken = signRefreshToken({ sub: userId, tokenId });
  return { accessToken, refreshToken: `${refreshToken}.${rawRefresh}` };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  let referredById: string | undefined;
  if (input.referralCode) {
    const referrer = await prisma.user.findUnique({ where: { referralCode: input.referralCode } });
    if (referrer) referredById = referrer.id;
  }

  const passwordHash = await hashPassword(input.password);
  const referralCode = generateToken(4).toUpperCase();

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      passwordHash,
      userType: input.userType,
      referralCode,
      referredById,
      wallet: { create: { balance: 0 } },
    },
  });

  if (input.userType === "RENTAL_PARTNER") {
    // Business profile is completed separately via the partner onboarding flow.
  }

  const tokens = await issueTokenPair(user.id, user.userType);
  return { user: sanitizeUser(user), ...tokens };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw ApiError.unauthorized("Invalid email or password");

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  if (user.accountStatus === "SUSPENDED" || user.accountStatus === "BANNED") {
    throw ApiError.forbidden("Your account has been suspended. Contact support.");
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const tokens = await issueTokenPair(user.id, user.userType);
  return { user: sanitizeUser(user), ...tokens };
}

export async function refresh(refreshToken: string) {
  const [jwtPart, rawRefresh] = refreshToken.split(".");
  if (!jwtPart || !rawRefresh) throw ApiError.unauthorized("Malformed refresh token");

  let payload;
  try {
    payload = verifyRefreshToken(jwtPart);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const tokenHash = hashToken(`${payload.tokenId}.${rawRefresh}`);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token is no longer valid");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw ApiError.unauthorized("User not found");

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

  const tokens = await issueTokenPair(user.id, user.userType);
  return { user: sanitizeUser(user), ...tokens };
}

export async function logout(refreshToken: string) {
  const [jwtPart, rawRefresh] = refreshToken.split(".");
  if (!jwtPart || !rawRefresh) return;
  try {
    const payload = verifyRefreshToken(jwtPart);
    const tokenHash = hashToken(`${payload.tokenId}.${rawRefresh}`);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch {
    // token already invalid — nothing to revoke
  }
}

export async function requestOtp(userId: string, purpose: "EMAIL_VERIFICATION" | "PHONE_VERIFICATION") {
  const code = generateOtp(6);
  await prisma.otpCode.create({
    data: {
      userId,
      code,
      purpose,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });
  // In production this dispatches via Nodemailer/SMS provider instead of returning the code.
  return code;
}

export async function verifyOtp(userId: string, code: string, purpose: "EMAIL_VERIFICATION" | "PHONE_VERIFICATION") {
  const otp = await prisma.otpCode.findFirst({
    where: { userId, code, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) throw ApiError.badRequest("Invalid or expired OTP");

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

  const data =
    purpose === "EMAIL_VERIFICATION"
      ? { emailVerifiedAt: new Date() }
      : { phoneVerifiedAt: new Date() };

  const user = await prisma.user.update({
    where: { id: userId },
    data: { ...data, accountStatus: "ACTIVE" },
  });
  return sanitizeUser(user);
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // do not leak account existence
  const code = generateOtp(6);
  await prisma.otpCode.create({
    data: {
      userId: user.id,
      code,
      purpose: "PASSWORD_RESET",
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });
  return code;
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw ApiError.badRequest("Invalid or expired code");

  const otp = await prisma.otpCode.findFirst({
    where: { userId: user.id, code, purpose: "PASSWORD_RESET", consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) throw ApiError.badRequest("Invalid or expired code");

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  // Invalidate all existing sessions after a password reset.
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) throw ApiError.badRequest("Current password is incorrect");

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export function sanitizeUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _omit, ...rest } = user;
  return rest;
}
