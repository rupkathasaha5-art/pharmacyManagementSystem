import { Router } from "express";
import { getManufacturerReturns, confirmManufacturerReturn } from "../controllers/manufacturerReturn.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verifyJWT(['SUPER_ADMIN']), getManufacturerReturns);
router.patch("/:id/confirm", verifyJWT(['SUPER_ADMIN']), confirmManufacturerReturn);

export default router;