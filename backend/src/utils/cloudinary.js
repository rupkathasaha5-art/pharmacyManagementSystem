import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
 
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
 

const uploadFileOnCloudinary = async (localFilePath) => {
    if (!localFilePath) {
        return null;
    }
 
    if (!fs.existsSync(localFilePath)) {
        console.error("Cloudinary Upload Error: local file not found at", localFilePath);
        return null;
    }
 
    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "chemist-licenses",
            //keeps the original filename traceable in Cloudinary's dashboard
            use_filename: true,
            unique_filename: true
        });
 
        //remove the local temp file now that Cloudinary has a copy
        fs.unlinkSync(localFilePath);
 
        console.log("File has been successfully uploaded to Cloudinary!!", response.secure_url);
        return response;
    } catch (error) {
        //clean up the temp file even if the upload failed, so it doesn'tlinger in ./public/temp
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.error("Cloudinary Upload Error:", error.message || error);
        return null;
    }
};
 

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