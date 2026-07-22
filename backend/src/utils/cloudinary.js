import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
 
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
 
/**
 * Uploads a local file to Cloudinary and removes the local temp copy
 * regardless of outcome. Intended for chemist license PDFs, so files
 * are grouped into a dedicated folder and the secure HTTPS url is returned.
 *
 * @param {string} localFilePath - path to the temp file written by multer
 * @returns {Promise<object|null>} the Cloudinary response, or null on failure
 */
const uploadFileOnCloudinary = async (localFilePath) => {
    if (!localFilePath) {
        return null;
    }
 
    // Guard against a path that doesn't actually exist on disk
    // (e.g. multer failed silently, or the path was already cleaned up)
    if (!fs.existsSync(localFilePath)) {
        console.error("Cloudinary Upload Error: local file not found at", localFilePath);
        return null;
    }
 
    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "chemist-licenses",
            // Keeps the original filename traceable in Cloudinary's dashboard
            use_filename: true,
            unique_filename: true
        });
 
        // Remove the local temp file now that Cloudinary has a copy
        fs.unlinkSync(localFilePath);
 
        console.log("File has been successfully uploaded to Cloudinary!!", response.secure_url);
        return response;
    } catch (error) {
        // Clean up the temp file even if the upload failed, so it doesn't
        // linger in ./public/temp
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.error("Cloudinary Upload Error:", error.message || error);
        return null;
    }
};
 
/**
 * Deletes a previously uploaded file from Cloudinary. Useful if you ever
 * need to remove a license document (e.g. chemist re-uploads a corrected
 * PDF, or an admin rejects and clears the old one).
 *
 * @param {string} publicId - the Cloudinary public_id of the asset
 * @param {string} resourceType - "image" | "raw" | "video" (default "raw" for PDFs)
 */
const deleteFileFromCloudinary = async (publicId, resourceType = "raw") => {
    if (!publicId) {
        return null;
    }
 
    try {
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        return response;
    } catch (error) {
        console.error("Cloudinary Delete Error:", error.message || error);
        return null;
    }
};
 
export { uploadFileOnCloudinary, deleteFileFromCloudinary };