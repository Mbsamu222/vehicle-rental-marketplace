import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth";
import { requireUserType } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as controller from "./bookings.controller";
import { createBookingSchema, cancelBookingSchema, updateStatusSchema } from "./bookings.validation";

const router = Router();
const idParam = { params: z.object({ id: z.string().uuid() }) };

router.use(authenticate);

router.post("/", requireUserType("CUSTOMER"), validate({ body: createBookingSchema }), controller.create);
router.get("/mine", requireUserType("CUSTOMER"), controller.listMyBookings);
router.post(
  "/:id/cancel",
  requireUserType("CUSTOMER"),
  validate({ ...idParam, body: cancelBookingSchema }),
  controller.cancel,
);

router.get("/partner/mine", requireUserType("RENTAL_PARTNER"), controller.listPartnerBookings);
router.patch(
  "/:id/status",
  requireUserType("RENTAL_PARTNER"),
  validate({ ...idParam, body: updateStatusSchema }),
  controller.updateStatus,
);

router.get("/:id", validate(idParam), controller.getById);

export default router;
