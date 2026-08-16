import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.model.js";
import { Org } from "../models/Org.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isPhoneValid = (phone) => /^\+?[0-9]{7,15}$/.test(phone.trim());

const VALID_ROLES = ["ORG_ADMIN", "SUPER_ADMIN", "DRIVER"];

const options = {
    httpOnly: true,
    secure: true
};

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, error.message);
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { name, org, email, phone, password, role } = req.body;

    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password?.trim() || !role?.trim()) {
        throw new ApiError(400, "Name, email, phone, password, and role are completely required!!");
    }

    if (!isEmailValid(email.trim())) {
        throw new ApiError(400, "Email format is invalid.");
    }

    if (!isPhoneValid(phone)) {
        throw new ApiError(400, "Phone number format is invalid.");
    }

    const trimmedRole = role.trim();
    if (!VALID_ROLES.includes(trimmedRole)) {
        throw new ApiError(400, `Role must be one of: ${VALID_ROLES.join(", ")}`);
    }

    if (trimmedRole === "SUPER_ADMIN") {
        const existingSuperAdmin = await User.findOne({ role: "SUPER_ADMIN" });
        if (existingSuperAdmin) {
            throw new ApiError(
                403, 
                "A Super Admin account already exists."
            );
        }
    }

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
        if (dbError.code === 11000) {
            const duplicateField = Object.keys(dbError.keyPattern || {})[0] || "field";
            throw new ApiError(409, `An account with this ${duplicateField} already exists!!`);
        }
        throw dbError;
    }

    // Populate org document on successful registration response
    const createdUser = await User.findById(user._id)
        .populate("org")
        .select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Could not completely verify user registration initialization.");
    }

    return res.status(201).json(
         new ApiResponse(201, createdUser, "User registered successfully!!")
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    if (!email) {
        throw new ApiError(401, "Email is required!!");
    }
    
    const existedUser = await User.findOne({ email });
    
    if (!existedUser) {
        throw new ApiError(400, "User does not exist!! Please register.");
    }
    
    const isPasswordCorrect = await existedUser.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(404, "Wrong password!!");
    }
    
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(existedUser._id);

    // Populate org so the frontend receives the full organization KYC and credit profile
    const loggedInUser = await User.findById(existedUser._id)
        .populate("org")
        .select("-password -refreshToken");

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,
        {
            user: loggedInUser,
            accessToken,
            refreshToken
        },
        "User logged in successfully!!")
    );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully!!"));
});

export {
    registerUser,
    loginUser,
    logoutUser
};