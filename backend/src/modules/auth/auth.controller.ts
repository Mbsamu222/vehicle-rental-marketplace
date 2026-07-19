import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import * as authService from "./auth.service";
import { prisma } from "../../config/prisma";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  return sendSuccess(res, result, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return sendSuccess(res, result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refresh(req.body.refreshToken);
  return sendSuccess(res, result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  return sendSuccess(res, { message: "Logged out" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw ApiError.notFound("User not found");
  return sendSuccess(res, authService.sanitizeUser(user));
});

export const requestOtp = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const code = await authService.requestOtp(req.user.id, req.body.purpose);
  return sendSuccess(res, { message: "OTP sent", ...(process.env.NODE_ENV !== "production" ? { code } : {}) });
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await authService.verifyOtp(req.user.id, req.body.otp, req.body.purpose);
  return sendSuccess(res, user);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const code = await authService.forgotPassword(req.body.email);
  return sendSuccess(res, {
    message: "If an account exists, a reset code has been sent",
    ...(process.env.NODE_ENV !== "production" && code ? { code } : {}),
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  await authService.resetPassword(email, otp, newPassword);
  return sendSuccess(res, { message: "Password has been reset" });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  return sendSuccess(res, { message: "Password changed" });
});
