import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import usersRoutes from "../modules/users/users.routes";
import catalogRoutes from "../modules/catalog/catalog.routes";
import rentalPartnersRoutes from "../modules/rentalPartners/rentalPartners.routes";
import vehiclesRoutes from "../modules/vehicles/vehicles.routes";
import bookingsRoutes from "../modules/bookings/bookings.routes";
import paymentsRoutes from "../modules/payments/payments.routes";
import reviewsRoutes from "../modules/reviews/reviews.routes";
import notificationsRoutes from "../modules/notifications/notifications.routes";
import couponsRoutes from "../modules/coupons/coupons.routes";
import supportRoutes from "../modules/support/support.routes";
import adminRoutes from "../modules/admin/admin.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/catalog", catalogRoutes);
router.use("/rental-partners", rentalPartnersRoutes);
router.use("/vehicles", vehiclesRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/reviews", reviewsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/coupons", couponsRoutes);
router.use("/support-tickets", supportRoutes);
router.use("/admin", adminRoutes);

export default router;
