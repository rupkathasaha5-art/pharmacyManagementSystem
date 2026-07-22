import { Router } from "express";
import { registerUser, loginUser, getCurrentUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getPendingKycQueue,processKycApplication,downloadOrgLicensePdf } from "../controllers/superAdmin.controller.js";

const router = Router();

// --- PUBLIC ROUTES ---
router.route("/register-user").post(registerUser);
router.route("/login").post(loginUser);

// --- SECURED ROUTES ---
router.route("/current-user").get(verifyJWT(), getCurrentUser);

// --- SUPER ADMIN KYC ROUTES ---
router.route("/kyc/pending").get(verifyJWT(["SUPER_ADMIN"]), getPendingKycQueue);
router.route("/kyc/review/:orgId").patch(verifyJWT(["SUPER_ADMIN"]), processKycApplication);
router.route("/kyc/download-license/:orgId").get(verifyJWT(["SUPER_ADMIN"]), downloadOrgLicensePdf);

export default router;