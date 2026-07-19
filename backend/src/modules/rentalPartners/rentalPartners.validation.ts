import { z } from "zod";

export const createPartnerProfileSchema = z.object({
  businessName: z.string().min(1).max(200),
  businessEmail: z.string().email(),
  businessPhone: z.string().min(7).max(20),
  cityId: z.string().uuid(),
  address: z.string().min(1),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  logoUrl: z.string().url().optional(),
  description: z.string().max(2000).optional(),
});

export const updatePartnerProfileSchema = createPartnerProfileSchema.partial();

export const uploadDocumentSchema = z.object({
  type: z.enum(["BUSINESS_LICENSE", "GST_CERTIFICATE", "IDENTITY_PROOF", "ADDRESS_PROOF", "BANK_PROOF", "OTHER"]),
  fileUrl: z.string().url(),
});

export const reviewDocumentSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().max(500).optional(),
});

export const setBankDetailsSchema = z.object({
  accountHolder: z.string().min(1).max(150),
  accountNumber: z.string().min(4).max(34),
  ifscCode: z.string().min(4).max(20),
  bankName: z.string().min(1).max(150),
  branch: z.string().max(150).optional(),
});

export const updateVerificationStatusSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "VERIFIED", "REJECTED"]),
});
