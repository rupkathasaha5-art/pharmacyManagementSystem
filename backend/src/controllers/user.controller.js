import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/User.model.js";
import {Org} from "../models/Org.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// Basic phone sanity check: 7-15 digits, optional leading +. Loosely permissive
// since formats vary (landline, mobile, country codes) - tighten if you standardize input.
const isPhoneValid = (phone) => /^\+?[0-9]{7,15}$/.test(phone.trim());

const VALID_ROLES = ["ORG_ADMIN", "SUPER_ADMIN", "DRIVER"];

const options={
    httpOnly:true,
    secure:true
}

const generateAccessAndRefreshTokens=async(userId)=>{
    try{
        const user=await User.findById(userId);
        const refreshToken=user.generateRefreshToken();
        const accessToken=user.generateAccessToken();
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});
        return {accessToken,refreshToken};
    }catch(error){
        throw new ApiError(500,error.message);
    }
}





const registerUser = asyncHandler(async (req, res) => {
    const { name, org, email, phone, password, role } = req.body;

    // 1. Base required-field check (org is intentionally excluded here since
    // it's only mandatory for ORG_ADMIN, checked separately below)
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password?.trim() || !role?.trim()) {
        throw new ApiError(400, "Name, email, phone, password, and role are completely required!!");
    }

    // 2. Format checks
    if (!isEmailValid(email.trim())) {
        throw new ApiError(400, "Email format is invalid.");
    }

    if (!isPhoneValid(phone)) {
        throw new ApiError(400, "Phone number format is invalid.");
    }

    // 3. Role must match the schema's allowed enum values
    const trimmedRole = role.trim();
    if (!VALID_ROLES.includes(trimmedRole)) {
        throw new ApiError(400, `Role must be one of: ${VALID_ROLES.join(", ")}`);
    }

    // ── NEW: SUPER ADMIN LOCKDOWN RULE ──────────────────────────────────────
    // If someone is trying to register a SUPER_ADMIN, check if one already exists!
    if (trimmedRole === "SUPER_ADMIN") {
        const existingSuperAdmin = await User.findOne({ role: "SUPER_ADMIN" });
        if (existingSuperAdmin) {
            throw new ApiError(
                403, 
                "A Super Admin account already exists."
            );
        }
    }
    // ────────────────────────────────────────────────────────────────────────

    // 4. ORG_ADMIN must be linked to a valid, existing Org.
    // SUPER_ADMIN and DRIVER should NOT be attached to an org at all.
    if (trimmedRole === "ORG_ADMIN") {
        if (!org || !mongoose.Types.ObjectId.isValid(org)) {
            throw new ApiError(400, "A valid organization reference is required for an Org Admin account.");
        }

        const existingOrg = await Org.findById(org);
        if (!existingOrg) {
            throw new ApiError(404, "The referenced organization could not be found.");
        }
    } else if (org) {
        throw new ApiError(400, `${trimmedRole} accounts cannot be linked to an organization.`);
    }

    // 5. Duplicate checks - both email and phone are unique on the schema,
    // so both need to be checked to avoid an unhandled Mongo 11000 error.
    const existedUser = await User.findOne({
        $or: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }]
    });

    if (existedUser) {
        if (existedUser.email === email.toLowerCase().trim()) {
            throw new ApiError(409, "Operational profile with this email already exists!!");
        }
        throw new ApiError(409, "Operational profile with this phone number already exists!!");
    }

    let user;
    try {
        user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            password,
            role: trimmedRole,
            org: trimmedRole === "ORG_ADMIN" ? org : undefined
        });
    } catch (dbError) {
        // Safety net in case of a race condition between the findOne check above
        // and the actual insert (two requests landing at nearly the same time)
        if (dbError.code === 11000) {
            const duplicateField = Object.keys(dbError.keyPattern || {})[0] || "field";
            throw new ApiError(409, `An account with this ${duplicateField} already exists!!`);
        }
        throw dbError;
    }

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Could not completely verify user registration initialization.");
    }

    return res.status(201).json(
         new ApiResponse(201, createdUser, "User registered successfully!!")
    );
});


const loginUser=asyncHandler(async(req,res)=>{
    //take data from frontend
    const {email,password}=req.body;
    //validate
    if(!email){
        throw new ApiError(401,"Email is required!!");
    }
    //check for user
    const existedUser = await User.findOne({ email });
    
    if(!existedUser){
        throw new ApiError(400,"User does not exist!!Please register.");
    }
    //check if the password is correct
    const isPasswordCorrect=await existedUser.isPasswordCorrect(password);
    if(!isPasswordCorrect){
        throw new ApiError(404,"Wrong password!!");
    }
    //generate access and refresh tokens 
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(existedUser._id);

    //remove sensitive fields
    const loggedInUser=await User.findById(existedUser._id).select("-password -refreshToken");

    //send res
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
        {
        "user":loggedInUser,
        accessToken,
        refreshToken
        },
        
        "User logged in successfully!!")
    )
})



const getCurrentUser = async (req, res) => {
    try {
        // req.user.id is set by your protect/verifyJWT middleware
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User profile not found." });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                organization: user.org // Access company associations cleanly
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Session recovery failed.", error: error.message });
    }
};
export {registerUser,
    loginUser,
    getCurrentUser,
};