import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissionIds: z.array(z.string().uuid()).default([]),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export const assignRoleSchema = z.object({
  roleId: z.string().uuid(),
});

export const upsertCmsPageSchema = z.object({
  slug: z.string().min(1).max(150),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
});

export const upsertBlogPostSchema = z.object({
  slug: z.string().min(1).max(150),
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1),
  coverImageUrl: z.string().url().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export const upsertSettingSchema = z.object({
  value: z.unknown(),
});

export const reviewDrivingLicenseSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  rejectionReason: z.string().max(500).optional(),
});
