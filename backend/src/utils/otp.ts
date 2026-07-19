import crypto from "node:crypto";

export function generateOtp(length = 6): string {
  const max = 10 ** length;
  const otp = crypto.randomInt(0, max).toString().padStart(length, "0");
  return otp;
}

export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
