import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Order from "../models/Order.model.js";
import { Org } from "../models/Org.model.js";
import { uploadFileOnCloudinary, deleteFileFromCloudinary } from "../utils/cloudinary.js";
import fs from "fs";


// GET /api/v1/org-admin/my-financial-summary
export const getMyFinancialSummary = asyncHandler(async (req, res) => {
  const orgId = req.user.org || req.user.organization;
  if (!orgId) throw new ApiError(400, "No organization associated with this account.");

  const org = await Org.findById(orgId).select('creditProfile status');
  if (!org) throw new ApiError(404, "Organization not found.");

  const now = new Date();
  const unsettledOrders = await Order.find({
    buyerOrg: orgId,
    paymentMethod: 'net_14',
    creditSettled: false,
    status: { $ne: 'cancelled' }
  }).select('invoiceNumber orderTotal amountSettled dueDate status createdAt').sort({ dueDate: 1 });

  const invoices = unsettledOrders.map((o) => {
    const remaining = Number((o.orderTotal - (o.amountSettled || 0)).toFixed(2));
    const daysUntilDue = Math.ceil((new Date(o.dueDate) - now) / (1000 * 60 * 60 * 24));
    return {
      orderId: o._id,
      invoiceNumber: o.invoiceNumber,
      orderTotal: o.orderTotal,
      amountRemaining: remaining,
      dueDate: o.dueDate,
      daysUntilDue,
      status: o.status,
    };
  });

  const creditLimit = org.creditProfile?.creditLimit || 0;
  const currentOutstanding = org.creditProfile?.currentOutstanding || 0;

  return res.status(200).json(
    new ApiResponse(200, {
      creditLimit,
      currentOutstanding,
      availableCredit: Math.max(0, creditLimit - currentOutstanding),
      isCreditFrozen: org.creditProfile?.isCreditFrozen || false,
      freezeReason: org.creditProfile?.freezeReason || null,
      creditDays: org.creditProfile?.creditDays || 14,
      invoices,
    }, "Financial summary fetched.")
  );
});

// GET /api/v1/org-admin/my-orders
export const getMyOrders = asyncHandler(async (req, res) => {
  const orgId = req.user.org || req.user.organization;
  if (!orgId) throw new ApiError(400, "No organization associated with this account.");

  const orders = await Order.find({ buyerOrg: orgId })
    .select('+deliveryOtp')
    .sort({ createdAt: -1 });

  const sanitized = orders.map((o) => {
    const obj = o.toObject();
    if (obj.status !== 'out_for_delivery') {
      delete obj.deliveryOtp;
    }
    return obj;
  });

  return res.status(200).json(new ApiResponse(200, sanitized, "Your orders fetched."));
});




// GET /api/v1/org-admin/my-profile
export const getMyComplianceProfile = asyncHandler(async (req, res) => {
  const orgId = req.user.org || req.user.organization;
  if (!orgId) throw new ApiError(400, "No organization associated with this account.");

  const org = await Org.findById(orgId).select('organization status statusRemarks');
  if (!org) throw new ApiError(404, "Organization not found.");

  return res.status(200).json(new ApiResponse(200, org, "Compliance profile fetched."));
});

// PATCH /api/v1/org-admin/resubmit-kyc
// Only usable when the org's KYC was rejected — lets them re-upload a
// corrected license document (and optionally correct the license number /
// expiry date) and puts the application back into the review queue.
export const resubmitKyc = asyncHandler(async (req, res) => {
  const orgId = req.user.org || req.user.organization;
  if (!orgId) {
    cleanupTempFile(req.file?.path);
    throw new ApiError(400, "No organization associated with this account.");
  }

  const org = await Org.findById(orgId);
  if (!org) {
    cleanupTempFile(req.file?.path);
    throw new ApiError(404, "Organization not found.");
  }

  if (org.status !== 'rejected') {
    cleanupTempFile(req.file?.path);
    throw new ApiError(400, `Only rejected applications can be resubmitted. Current status: ${org.status}`);
  }

  if (!req.file) {
    throw new ApiError(400, "A new license PDF is required to resubmit.");
  }

  const cloudinaryResponse = await uploadFileOnCloudinary(req.file.path);
  if (!cloudinaryResponse) {
    throw new ApiError(500, "Upload failed: could not store the new license document. Please try again.");
  }

  const oldDocumentUrl = org.organization.license.documentUrl;

  // Optional corrections alongside the re-upload — only applied if provided
  const { licenseNumber, licenseExpiryDate } = req.body;
  if (licenseNumber?.trim()) org.organization.license.number = licenseNumber.trim();
  if (licenseExpiryDate) org.organization.license.expiryDate = new Date(licenseExpiryDate);

  org.organization.license.documentUrl = cloudinaryResponse.secure_url;
  org.status = 'pending';
  org.statusRemarks = null;

  await org.save();

  // Clean up the old file only after the new one is safely saved
  if (oldDocumentUrl) {
    const oldPublicId = oldDocumentUrl.split('/').slice(-2).join('/').split('.')[0];
    await deleteFileFromCloudinary(oldPublicId, 'raw');
  }

  return res.status(200).json(
    new ApiResponse(200, { status: org.status }, "Resubmitted successfully. Your application is back under review.")
  );
});

const cleanupTempFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
};