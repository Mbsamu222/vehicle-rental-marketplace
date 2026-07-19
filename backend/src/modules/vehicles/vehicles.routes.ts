import { Router } from "express";
import { z } from "zod";
import { authenticate, optionalAuthenticate } from "../../middleware/auth";
import { requireUserType, requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as controller from "./vehicles.controller";
import {
  createVehicleSchema,
  updateVehicleSchema,
  addImagesSchema,
  blockAvailabilitySchema,
  approveVehicleSchema,
  searchVehiclesSchema,
} from "./vehicles.validation";

const router = Router();
const partnerOnly = [authenticate, requireUserType("RENTAL_PARTNER")];
const adminOnly = [authenticate, requireUserType("ADMIN", "SUPER_ADMIN")];
const idParam = { params: z.object({ id: z.string().uuid() }) };

// Public
router.get("/search", optionalAuthenticate, validate({ query: searchVehiclesSchema }), controller.search);
router.get("/:id", validate(idParam), controller.getById);
router.get(
  "/:id/availability",
  validate({
    params: z.object({ id: z.string().uuid() }),
    query: z.object({ pickupDatetime: z.coerce.date(), returnDatetime: z.coerce.date() }),
  }),
  controller.checkAvailability,
);

// Rental partner self-service
router.get("/partner/mine", ...partnerOnly, controller.listMyVehicles);
router.post("/", ...partnerOnly, validate({ body: createVehicleSchema }), controller.createVehicle);
router.patch("/:id", ...partnerOnly, validate({ ...idParam, body: updateVehicleSchema }), controller.updateVehicle);
router.delete("/:id", ...partnerOnly, validate(idParam), controller.deleteVehicle);
router.post(
  "/:id/images",
  ...partnerOnly,
  validate({ ...idParam, body: addImagesSchema }),
  controller.addImages,
);
router.delete(
  "/:id/images/:imageId",
  ...partnerOnly,
  validate({ params: z.object({ id: z.string().uuid(), imageId: z.string().uuid() }) }),
  controller.deleteImage,
);
router.post(
  "/:id/availability-block",
  ...partnerOnly,
  validate({ ...idParam, body: blockAvailabilitySchema }),
  controller.blockAvailability,
);

// Admin
router.get(
  "/admin/pending-approval",
  ...adminOnly,
  requirePermission("vehicles.approve"),
  controller.listPendingApproval,
);
router.patch(
  "/:id/review",
  ...adminOnly,
  requirePermission("vehicles.approve"),
  validate({ ...idParam, body: approveVehicleSchema }),
  controller.reviewVehicle,
);

export default router;
