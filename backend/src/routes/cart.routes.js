import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getCart, syncCart } from "../controllers/cart.controller.js";

const router = Router();


// Cart Endpoints
router.route("/cart").get(verifyJWT(["ORG_ADMIN"]), getCart);
router.route("/cart/sync").post(verifyJWT(["ORG_ADMIN"]), syncCart);

export default router;