import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth";
import { requireUserType, requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as controller from "./coupons.controller";
import { createCouponSchema, updateCouponSchema, validateCouponSchema } from "./coupons.validation";

const router = Router();
const adminOnly = [authenticate, requireUserType("ADMIN", "SUPER_ADMIN")];
const idParam = { params: z.object({ id: z.string().uuid() }) };

router.post("/validate", authenticate, validate({ body: validateCouponSchema }), controller.validateCoupon);

router.get("/", ...adminOnly, requirePermission("coupons.manage"), controller.list);
router.post(
  "/",
  ...adminOnly,
  requirePermission("coupons.manage"),
  validate({ body: createCouponSchema }),
  controller.create,
);
router.patch(
  "/:id",
  ...adminOnly,
  requirePermission("coupons.manage"),
  validate({ ...idParam, body: updateCouponSchema }),
  controller.update,
);
router.delete("/:id", ...adminOnly, requirePermission("coupons.manage"), validate(idParam), controller.remove);

export default router;
