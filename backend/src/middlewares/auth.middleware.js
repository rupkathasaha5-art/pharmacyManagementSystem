import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import {User} from "../models/User.model.js";

export const verifyJWT=asyncHandler(async (req,res,next)=>{
    try {
        const token=req.cookies?.accessToken|| req.header("Authorization")?.replace("Bearer ","");
        /*req.cookies?.accessToken: First, it checks if the token came in via an httpOnly cookie (standard for React/web frontends). The ?. (optional chaining) ensures the app doesn't crash if req.cookies is undefined.
          || req.header("Authorization")?.replace("Bearer ",""): If there is no cookie, it falls back to checking the HTTP headers. (This is standard for Mobile Apps or Postman). Mobile apps usually send tokens in the format Authorization: Bearer xxxxx.yyyyy. The .replace("Bearer ", "") strips out the word "Bearer " so you are left with just the pure token string. */
    if(!token){
        throw new ApiError(401,"Unauthorized request")
    }

    const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    /*This is where the magic happens. The jwt.verify function takes the token and your secret key.
     *It mathematically checks the signature. If the token was altered by a hacker, or if the token has expired, this function will instantly throw a hard error (which drops you into the catch block below).
     *If it is valid, it decrypts the payload (which contains the user's _id) and stores it in decodedToken */
    const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
    
    if(!user){
        //next video discussion:frontend
        throw new ApiError(401,"Invalid Access Token")
    }

    req.user=user;
    /*This is the entire purpose of this middleware. You take the clean user object you just got from the database and attach it directly to the Express req (request) object.
      Now, whatever route comes next (like updateProfile) can just look at req.user._id to know exactly who is making the request. */

    next()
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token" )
    }

})