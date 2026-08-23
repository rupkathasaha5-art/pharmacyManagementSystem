import { Router } from "express";
import { createPaymentIntent, verifyPayment,createSettlementIntent,verifySettlement } from "../controllers/payment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Protected client intent creation
router.post("/create-intent", verifyJWT(['ORG_ADMIN']), createPaymentIntent);

// Protected payment verification
router.post("/verify", verifyJWT(['ORG_ADMIN']), verifyPayment);

router.post("/settlement/create-intent", verifyJWT(['ORG_ADMIN']), createSettlementIntent);
router.post("/settlement/verify", verifyJWT(['ORG_ADMIN']), verifySettlement);
export default router;