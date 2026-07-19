import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as controller from "./notifications.controller";

const router = Router();
router.use(authenticate);

router.get("/", controller.list);
router.patch("/:id/read", validate({ params: z.object({ id: z.string().uuid() }) }), controller.markRead);
router.patch("/read-all", controller.markAllRead);

export default router;
