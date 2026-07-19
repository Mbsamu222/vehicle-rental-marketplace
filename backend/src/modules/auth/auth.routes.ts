import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import { authLimiter } from "../../middleware/rateLimit";
import * as controller from "./auth.controller";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  verifyOtpSchema,
  requestOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "./auth.validation";

const router = Router();

router.post("/register", authLimiter, validate({ body: registerSchema }), controller.register);
router.post("/login", authLimiter, validate({ body: loginSchema }), controller.login);
router.post("/refresh", validate({ body: refreshSchema }), controller.refresh);
router.post("/logout", validate({ body: refreshSchema }), controller.logout);
router.get("/me", authenticate, controller.me);

router.post("/otp/request", authenticate, validate({ body: requestOtpSchema }), controller.requestOtp);
router.post("/otp/verify", authenticate, validate({ body: verifyOtpSchema }), controller.verifyOtp);

router.post(
  "/forgot-password",
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  controller.forgotPassword,
);
router.post("/reset-password", authLimiter, validate({ body: resetPasswordSchema }), controller.resetPassword);
router.post(
  "/change-password",
  authenticate,
  validate({ body: changePasswordSchema }),
  controller.changePassword,
);

export default router;
