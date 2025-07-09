import { Router } from "express";
import multer from "multer";
import { ProductComissioningController } from "../controllers/product-comissioning-controller";

const upload = multer();
const productComissioningController = new ProductComissioningController();

const productComissioningRouter = Router();

productComissioningRouter.get(
  "/product-comissioning",
  productComissioningController.get
);
productComissioningRouter.post(
  "/product-comissioning",
  upload.any(),
  productComissioningController.create
);
productComissioningRouter.put(
  "/product-comissioning",
  upload.any(),
  productComissioningController.update
);
productComissioningRouter.delete(
  "/product-comissioning",
  productComissioningController.delete
);

export { productComissioningRouter };
