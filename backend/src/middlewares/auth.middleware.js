import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";


export const verifyJWT = (allowedRoles = []) => {
    return asyncHandler(async (req, res, next) => {
        try {
            console.log("🔐 [verifyJWT] START -", req.method, req.originalUrl);

            const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
            console.log("🔐 [verifyJWT] token present?", !!token);

            if (!token) {
                throw new ApiError(401, "Unauthorized request: No token provided");
            }

            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            console.log("🔐 [verifyJWT] token decoded, _id:", decodedToken?._id);

            const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
            console.log("🔐 [verifyJWT] user lookup complete. found?", !!user, "role:", user?.role);

            if (!user) {
                throw new ApiError(401, "Invalid Access Token");
            }

            if (!user.isActive) {
                throw new ApiError(403, "Your account has been deactivated. Please contact support.");
            }

            // If roles were specified check if the user's role is permitted
            if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                console.log("🔐 [verifyJWT] role check FAILED. user role:", user.role, "allowed:", allowedRoles);
                throw new ApiError(
                    403, 
                    `Access Denied: Role '${user.role}' is not authorized to access this resource.`
                );
            }
            // ────────────────────────────────────────────────────────────────

            req.user = user;
            console.log("🔐 [verifyJWT] SUCCESS - calling next()");
            next();
        } catch (error) {
            console.log("🔐 [verifyJWT] CAUGHT ERROR:", error.message, "statusCode:", error.statusCode);
            // Forward the exact status code if it's already an ApiError (like 403 or 401), else default to 401
            const statusCode = error.statusCode || 401;
            throw new ApiError(statusCode, error?.message || "Invalid access token");
        }
    });
};