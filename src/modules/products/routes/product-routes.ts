import { Router } from "express";
import multer from "multer";
import { ProductController } from "../controllers/product-controller";

const upload = multer();
const productController = new ProductController();

const productRouter = Router();

productRouter.get("/products", productController.get);
productRouter.post("/products", upload.any(), productController.create);
productRouter.put("/products", upload.any(), productController.update);
productRouter.delete("/products", productController.delete);

export { productRouter };
