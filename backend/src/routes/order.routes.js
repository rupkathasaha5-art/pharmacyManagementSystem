import { Router } from "express";
import { createOrder } from "../controllers/order.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// @route   POST /api/v1/orders/checkout
// @desc    Checkout cart and create B2B order using Net trade credit terms
// @access  Protected (ORG_ADMIN or BUYER)
router.route("/checkout").post(verifyJWT(["ORG_ADMIN"]), createOrder);

export default router;