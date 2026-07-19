import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth";
import { requireUserType } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as controller from "./reviews.controller";
import { createReviewSchema, replySchema, reportSchema } from "./reviews.validation";

const router = Router();

router.get(
  "/vehicle/:vehicleId",
  validate({ params: z.object({ vehicleId: z.string().uuid() }) }),
  controller.listByVehicle,
);
router.get(
  "/partner/:rentalPartnerId",
  validate({ params: z.object({ rentalPartnerId: z.string().uuid() }) }),
  controller.listByPartner,
);

router.post(
  "/",
  authenticate,
  requireUserType("CUSTOMER"),
  validate({ body: createReviewSchema }),
  controller.create,
);
router.post(
  "/:id/reply",
  authenticate,
  requireUserType("RENTAL_PARTNER", "ADMIN", "SUPER_ADMIN"),
  validate({ params: z.object({ id: z.string().uuid() }), body: replySchema }),
  controller.reply,
);
router.post(
  "/:id/report",
  authenticate,
  validate({ params: z.object({ id: z.string().uuid() }), body: reportSchema }),
  controller.report,
);

export default router;
