import { Router } from "express";
import { registerUser, loginUser,logoutUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getPendingKycQueue,processKycApplication,downloadOrgLicensePdf } from "../controllers/superAdmin.controller.js";
import {addProduct} from "../controllers/catalog.controller.js";
import { addInventory } from "../controllers/inventory.controller.js";

const router = Router();

//PUBLIC ROUTES 
router.route("/register-user").post(registerUser);
router.route("/login").post(loginUser);

//SECURED ROUTES
//router.route("/current-user").get(verifyJWT(), getCurrentUser);
router.route("/logout").get(verifyJWT(), logoutUser );

//SUPER ADMIN KYC ROUTES
router.route("/kyc/pending").get(verifyJWT(["SUPER_ADMIN"]), getPendingKycQueue);
router.route("/kyc/review/:orgId").patch(verifyJWT(["SUPER_ADMIN"]), processKycApplication);
router.route("/kyc/download-license/:orgId").get(verifyJWT(["SUPER_ADMIN"]), downloadOrgLicensePdf);
router.route("/add-product").post(verifyJWT(["SUPER_ADMIN"]),addProduct);
router.route("/add-inventory").post(verifyJWT(["SUPER_ADMIN"]),addInventory);

export default router;