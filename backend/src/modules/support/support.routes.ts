import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth";
import { requireUserType, requirePermission } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as controller from "./support.controller";
import { createTicketSchema, addMessageSchema, updateTicketStatusSchema } from "./support.validation";

const router = Router();
const idParam = { params: z.object({ id: z.string().uuid() }) };

router.use(authenticate);

router.post("/", validate({ body: createTicketSchema }), controller.create);
router.get("/mine", controller.listMine);
router.get("/:id", validate(idParam), controller.getById);
router.post("/:id/messages", validate({ ...idParam, body: addMessageSchema }), controller.addMessage);

router.get("/", requireUserType("ADMIN", "SUPER_ADMIN"), requirePermission("support.manage"), controller.listAll);
router.patch(
  "/:id/status",
  requireUserType("ADMIN", "SUPER_ADMIN"),
  requirePermission("support.manage"),
  validate({ ...idParam, body: updateTicketStatusSchema }),
  controller.updateStatus,
);

export default router;
