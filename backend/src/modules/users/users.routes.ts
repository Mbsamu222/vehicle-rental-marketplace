import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireUserType } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as controller from "./users.controller";
import { updateProfileSchema, addDrivingLicenseSchema, addSavedLocationSchema } from "./users.validation";
import { z } from "zod";

const router = Router();
router.use(authenticate);

router.patch("/me", validate({ body: updateProfileSchema }), controller.updateProfile);
router.get("/me/dashboard", requireUserType("CUSTOMER"), controller.getDashboard);

router.get("/me/driving-licenses", controller.listDrivingLicenses);
router.post(
  "/me/driving-licenses",
  validate({ body: addDrivingLicenseSchema }),
  controller.addDrivingLicense,
);

router.get("/me/wishlist", controller.listWishlist);
router.post(
  "/me/wishlist/:vehicleId",
  validate({ params: z.object({ vehicleId: z.string().uuid() }) }),
  controller.addToWishlist,
);
router.delete(
  "/me/wishlist/:vehicleId",
  validate({ params: z.object({ vehicleId: z.string().uuid() }) }),
  controller.removeFromWishlist,
);

router.get("/me/saved-locations", controller.listSavedLocations);
router.post(
  "/me/saved-locations",
  validate({ body: addSavedLocationSchema }),
  controller.addSavedLocation,
);
router.delete(
  "/me/saved-locations/:id",
  validate({ params: z.object({ id: z.string().uuid() }) }),
  controller.deleteSavedLocation,
);

export default router;
