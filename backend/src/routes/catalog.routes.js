import {Router} from "express";
import {getAllCatalogBatches,removeBatch,addProduct} from "../controllers/catalog.controller.js";

const router=Router();

router.route("/show-catalog").get(getAllCatalogBatches);
router.route("/remove-batch").post(removeBatch);//removes an entry from the catalog
router.route("/add-product").post(addProduct);

export default router;