import { Router } from "express";
import multer from "multer";
import { ProductTypeController } from "../controllers/product-type-controller";

const upload = multer();
const productTypeController = new ProductTypeController();

const productTypeRouter = Router();

productTypeRouter.get("/product-types", productTypeController.get);
productTypeRouter.post(
  "/product-types",
  upload.any(),
  productTypeController.create
);
productTypeRouter.put(
  "/product-types",
  upload.any(),
  productTypeController.update
);
productTypeRouter.delete("/product-types", productTypeController.delete);

export { productTypeRouter };
