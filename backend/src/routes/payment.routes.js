import { Router } from "express";
import { createPaymentIntent, handleStripeWebhook } from "../controllers/payment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Webhook listener (body is already parsed as Buffer by app.js)
router.post("/webhook", handleStripeWebhook);

// Protected client intent creation
router.post("/create-intent", verifyJWT, createPaymentIntent);

export default router;