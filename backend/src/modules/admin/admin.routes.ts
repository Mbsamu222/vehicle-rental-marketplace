import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth";
import { requireUserType, requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as controller from "./admin.controller";
import {
  createRoleSchema,
  updateRoleSchema,
  assignRoleSchema,
  upsertCmsPageSchema,
  upsertBlogPostSchema,
  upsertSettingSchema,
  reviewDrivingLicenseSchema,
} from "./admin.validation";

const router = Router();
const idParam = { params: z.object({ id: z.string().uuid() }) };

// Public CMS/Blog reads
router.get("/cms/:slug", controller.getCmsPage);
router.get("/blog", controller.listBlogPosts);
router.get("/blog/:slug", controller.getBlogPost);

router.use(authenticate, requireUserType("ADMIN", "SUPER_ADMIN"));

router.get("/dashboard", requirePermission("analytics.view"), controller.getDashboard);

router.get("/permissions", requirePermission("roles.manage"), controller.listPermissions);
router.get("/roles", requirePermission("roles.manage"), controller.listRoles);
router.post("/roles", requirePermission("roles.manage"), validate({ body: createRoleSchema }), controller.createRole);
router.patch(
  "/roles/:id",
  requirePermission("roles.manage"),
  validate({ ...idParam, body: updateRoleSchema }),
  controller.updateRole,
);
router.delete("/roles/:id", requirePermission("roles.manage"), validate(idParam), controller.deleteRole);
router.post(
  "/users/:userId/role",
  requirePermission("roles.manage"),
  validate({ params: z.object({ userId: z.string().uuid() }), body: assignRoleSchema }),
  controller.assignRoleToUser,
);

router.get("/users", requirePermission("users.manage"), controller.listUsers);
router.patch(
  "/users/:id/status",
  requirePermission("users.manage"),
  validate({ ...idParam, body: z.object({ status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]) }) }),
  controller.updateUserStatus,
);

router.get("/audit-logs", requirePermission("audit.view"), controller.listAuditLogs);

router.get("/driving-licenses", requirePermission("users.manage"), controller.listDrivingLicenses);
router.patch(
  "/driving-licenses/:id/review",
  requirePermission("users.manage"),
  validate({ ...idParam, body: reviewDrivingLicenseSchema }),
  controller.reviewDrivingLicense,
);

router.put("/cms", requirePermission("cms.manage"), validate({ body: upsertCmsPageSchema }), controller.upsertCmsPage);
router.put(
  "/blog",
  requirePermission("cms.manage"),
  validate({ body: upsertBlogPostSchema }),
  controller.upsertBlogPost,
);

router.get("/settings/:key", requirePermission("settings.manage"), controller.getSetting);
router.put(
  "/settings/:key",
  requirePermission("settings.manage"),
  validate({ body: upsertSettingSchema }),
  controller.upsertSetting,
);

export default router;
