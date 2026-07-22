import {Router} from "express";
import { upload } from '../middlewares/multer.middleware.js';
import { registerOrg } from '../controllers/org.controller.js';
const router=Router();

router.post('/register-org', upload.single('licenseDocument'), registerOrg);
export default router;