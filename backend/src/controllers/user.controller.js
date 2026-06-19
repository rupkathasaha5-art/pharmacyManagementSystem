import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/User.model.js";
//import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


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
/*const registerUser=asyncHandler(async(req,res)=>{
    //take info from frontend
    const {name,email,password,role}=req.body;

    //validate info
    if (!name?.trim() || !email?.trim() || !password?.trim() || !role?.trim()) {
        throw new ApiError(400, "Name, email, password, and role are required!!");
    }

    // Check if the user exists already 
    const existedUser = await User.findOne({ email });

    if(existedUser){
        throw new ApiError(409,"User already exists!!");
    }

    //create user object
    const user=await User.create({
        name,email,password,role
    })

    //remove refresh token and password from res
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Could not create user!!");
    }

    //return res
    return res.status(200).json(
         new ApiResponse(200,"User registered successfully!!")
    )
})*/
const registerUser = asyncHandler(async (req, res) => {
     const { name,org, email, password, role } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim() || !role?.trim()) {
        throw new ApiError(400, "Name, email, password, and role are completely required!!");
    }

    const existedUser = await User.findOne({ email });

    if (existedUser) {
        throw new ApiError(409, "Operational profile with this email already exists!!");
    }

    const user = await User.create({
        name,
        email,
        password,
        role,
        org
    });

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