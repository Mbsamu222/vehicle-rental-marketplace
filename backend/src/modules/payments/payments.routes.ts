import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth";
import { requireUserType, requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as controller from "./payments.controller";
import { createPaymentSchema, verifyPaymentSchema, refundPaymentSchema } from "./payments.validation";

const router = Router();
router.use(authenticate);

router.post("/orders", requireUserType("CUSTOMER"), validate({ body: createPaymentSchema }), controller.createOrder);
router.post("/verify", requireUserType("CUSTOMER"), validate({ body: verifyPaymentSchema }), controller.verify);
router.get("/mine", requireUserType("CUSTOMER"), controller.listMyPayments);
router.get("/wallet", requireUserType("CUSTOMER"), controller.getWallet);

router.get(
  "/transactions",
  requireUserType("ADMIN", "SUPER_ADMIN"),
  requirePermission("payments.view"),
  controller.listTransactions,
);
router.post(
  "/:id/refund",
  requireUserType("ADMIN", "SUPER_ADMIN"),
  requirePermission("payments.refund"),
  validate({ params: z.object({ id: z.string().uuid() }), body: refundPaymentSchema }),
  controller.refund,
);

export default router;
