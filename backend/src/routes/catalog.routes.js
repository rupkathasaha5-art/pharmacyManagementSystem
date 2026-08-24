import {Router} from "express";
import {getCatalog,getClearanceCatalog} from "../controllers/catalog.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
//import { addInventory } from "../controllers/inventory.controller.js";
const router=Router();

router.route("/show-catalog").get(verifyJWT(["ORG_ADMIN", "SUPER_ADMIN"]), getCatalog);
router.get("/clearance", getClearanceCatalog); // add whatever auth you use for the regular catalog route here too


export default router;