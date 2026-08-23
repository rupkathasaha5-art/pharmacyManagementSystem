import { Router } from "express";
import {
  createOrder,
  cancelOrder,
  dispatchOrder,
  confirmDelivery,
  getOrderStatusSummary,
  getOrdersByStatus,
  getAccountsReceivable
} from "../controllers/order.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Existing checkout route
router.post("/checkout", verifyJWT(), createOrder); // adjust roles here if createOrder already restricts them

// Order lifecycle actions
router.post("/:id/cancel", verifyJWT(['ORG_ADMIN', 'SUPER_ADMIN']), cancelOrder);
router.post("/:id/dispatch", verifyJWT(['SUPER_ADMIN']), dispatchOrder);
router.post("/:id/confirm-delivery", verifyJWT(['DRIVER']), confirmDelivery);

// Admin dashboard routes
router.get("/admin/status-summary", verifyJWT(['SUPER_ADMIN']), getOrderStatusSummary);
router.get("/admin", verifyJWT(['SUPER_ADMIN']), getOrdersByStatus);
router.route("/admin/receivables").get(verifyJWT(["SUPER_ADMIN"]),getAccountsReceivable);

export default router;