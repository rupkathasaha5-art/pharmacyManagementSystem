import {Router} from "express";
import {registerOrg} from "../controllers/org.controller.js";

const router=Router();

router.route("/register-org").post(registerOrg);

export default router;