import {Router} from "express";
import {getCatalog} from "../controllers/catalog.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
//import { addInventory } from "../controllers/inventory.controller.js";
const router=Router();

router.route("/show-catalog").get(verifyJWT(["ORG_ADMIN", "SUPER_ADMIN"]), getCatalog);

//router.route("/add-product").post(addProduct);
//router.route("/add-inventory").post(addInventory);

export default router;