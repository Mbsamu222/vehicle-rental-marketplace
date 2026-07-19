import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth";
import { requireUserType, requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as controller from "./rentalPartners.controller";
import {
  createPartnerProfileSchema,
  updatePartnerProfileSchema,
  uploadDocumentSchema,
  reviewDocumentSchema,
  setBankDetailsSchema,
  updateVerificationStatusSchema,
} from "./rentalPartners.validation";

const router = Router();
const partnerOnly = [authenticate, requireUserType("RENTAL_PARTNER")];
const adminOnly = [authenticate, requireUserType("ADMIN", "SUPER_ADMIN")];

// Partner self-service
router.post("/me", ...partnerOnly, validate({ body: createPartnerProfileSchema }), controller.createProfile);
router.get("/me", ...partnerOnly, controller.getMyProfile);
router.patch("/me", ...partnerOnly, validate({ body: updatePartnerProfileSchema }), controller.updateMyProfile);
router.get("/me/dashboard", ...partnerOnly, controller.getDashboard);
router.post("/me/documents", ...partnerOnly, validate({ body: uploadDocumentSchema }), controller.uploadDocument);
router.put("/me/bank-details", ...partnerOnly, validate({ body: setBankDetailsSchema }), controller.setBankDetails);

// Admin oversight
router.get("/", ...adminOnly, requirePermission("partners.view"), controller.listPartners);
router.get(
  "/:id",
  ...adminOnly,
  requirePermission("partners.view"),
  validate({ params: z.object({ id: z.string().uuid() }) }),
  controller.getPartnerById,
);
router.patch(
  "/:id/verification-status",
  ...adminOnly,
  requirePermission("partners.verify"),
  validate({ params: z.object({ id: z.string().uuid() }), body: updateVerificationStatusSchema }),
  controller.updateVerificationStatus,
);
router.patch(
  "/documents/:documentId/review",
  ...adminOnly,
  requirePermission("partners.verify"),
  validate({ params: z.object({ documentId: z.string().uuid() }), body: reviewDocumentSchema }),
  controller.reviewDocument,
);

export default router;
