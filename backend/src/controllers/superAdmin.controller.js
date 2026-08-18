import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Org } from "../models/Org.model.js";
import axios from "axios";


export const getPendingKycQueue = asyncHandler(async (req, res) => {

    const pendingOrgs = await Org.find({ status: "pending" })
        .sort({ createdAt: -1 })
        .select("-creditProfile.currentOutstanding"); 

    if (!pendingOrgs || pendingOrgs.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "KYC queue is currently empty. No pending applications found.")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, pendingOrgs, "Pending KYC applications retrieved successfully.")
    );
});


export const downloadOrgLicensePdf = asyncHandler(async (req, res) => {
       const { orgId } = req.params;
       const org = await Org.findById(orgId);

       if (!org || !org.organization?.license?.documentUrl) {
           throw new ApiError(404, "License document URL not found.");
       }

       const pdfUrl = org.organization.license.documentUrl;
       const orgName = org.organization.name.replace(/[^a-zA-Z0-9]/g, "_");


       let response;
       try {
           response = await axios.get(pdfUrl, { responseType: 'stream' });
       } catch (fetchError) {
           
           const upstreamStatus = fetchError.response?.status;
           if (upstreamStatus === 401 || upstreamStatus === 403) {
               throw new ApiError(502, "Could not retrieve the license file from storage. Check Cloudinary's PDF/raw file delivery setting.");
           }
           throw new ApiError(502, "Could not retrieve the license file from storage. Please try again.");
       }

       res.setHeader('Content-Type', 'application/pdf');
       res.setHeader('Content-Disposition', `attachment; filename="${orgName}_Drug_License.pdf"`);

       
       response.data.on('error', (streamError) => {
           console.error("License PDF stream error:", streamError.message);
           if (!res.headersSent) {
               res.status(502).json(
                   new ApiError(502, "The download was interrupted. Please try again.")
               );
           } else {
               res.end();
           }
       });

       response.data.pipe(res);
});



export const processKycApplication = asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const { action, statusRemarks } = req.body;

    // 1. Strict validation of the requested action
    if (!action || !["approved", "rejected"].includes(action)) {
        throw new ApiError(400, "Invalid review action provided. Must be strictly 'approved' or 'rejected'.");
    }

    // 2. Locate the organization
    const org = await Org.findById(orgId);

    if (!org) {
        throw new ApiError(404, "Organization record not found in the database.");
    }

    // 3. Prevent reviewing an organization that is already processed
    if (org.status !== "pending") {
        throw new ApiError(400, `This organization has already been processed. Current status: ${org.status}`);
    }

    // 4. If rejecting
    if (action === "rejected" && (!statusRemarks || statusRemarks.trim() === "")) {
        throw new ApiError(400, "A reason for rejection must be provided in 'statusRemarks'.");
    }

    // 5. Apply updates
    org.status = action;
    org.statusRemarks = action === "rejected" ? statusRemarks.trim() : null;

  
    const updatedOrg = await org.save({ validateBeforeSave: false }); // Bypass full validation since we only updated specific fields

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                orgId: updatedOrg._id,
                name: updatedOrg.organization.name,
                newStatus: updatedOrg.status
            },
            `Organization '${updatedOrg.organization.name}' has been successfully ${action}.`
        )
    );
});