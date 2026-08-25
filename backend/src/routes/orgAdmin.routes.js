import { Router } from "express";
import { getMyFinancialSummary, getMyOrders, getMyComplianceProfile, resubmitKyc } from "../controllers/orgAdmin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.get("/my-financial-summary", verifyJWT(['ORG_ADMIN']), getMyFinancialSummary);
router.get("/my-orders", verifyJWT(['ORG_ADMIN']), getMyOrders);
router.get("/my-profile", verifyJWT(['ORG_ADMIN']), getMyComplianceProfile);
router.patch("/resubmit-kyc", verifyJWT(['ORG_ADMIN']), upload.single('licenseDocument'), resubmitKyc);
export default router;