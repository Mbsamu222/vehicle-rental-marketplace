import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireUserType } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import * as controller from "./catalog.controller";
import { createCountrySchema, createCitySchema, createCategorySchema, createBrandSchema } from "./catalog.validation";

const router = Router();

// Public reads
router.get("/countries", controller.listCountries);
router.get("/cities", controller.listCities);
router.get("/vehicle-categories", controller.listCategories);
router.get("/vehicle-brands", controller.listBrands);

// Admin-managed writes
const adminOnly = [authenticate, requireUserType("ADMIN", "SUPER_ADMIN")];

router.post("/countries", ...adminOnly, validate({ body: createCountrySchema }), controller.createCountry);
router.post("/cities", ...adminOnly, validate({ body: createCitySchema }), controller.createCity);
router.post(
  "/vehicle-categories",
  ...adminOnly,
  validate({ body: createCategorySchema }),
  controller.createCategory,
);
router.post("/vehicle-brands", ...adminOnly, validate({ body: createBrandSchema }), controller.createBrand);

export default router;
