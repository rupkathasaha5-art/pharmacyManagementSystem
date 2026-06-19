import {Router} from "express";
import {registerUser,loginUser,getCurrentUser} from "../controllers/user.controller.js";
//import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
//import { verify } from "jsonwebtoken";

const router=Router();

router.route("/register-user").post(registerUser);

router.route("/login").post(loginUser);

router.route("/current-user").get(verifyJWT,getCurrentUser);
//secured routes
/*router.route("/logout").post(verifyJWT,logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT,changeCurrentPassword);
router.route("/current-user").post(verify,getCurrentUser);
router.route("/update-details").patch(verifyJWT,updateAccountDetails);
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);
router.route("/cover-image").patch(verifyJWT,upload.single("/coverImage"),updateCoverImage);
router.route("/c/:username").get(verifyJWT,getUserChannelProfile);*/


export default router;