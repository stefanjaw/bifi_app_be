import { BaseRoutes } from "../../../system";
import { ProductController } from "../controllers/product-controller";
import { Product } from "../models/product.model";
import { ProductDTO, UpdateProductDTO } from "../models/product.dto";

const productController = new ProductController();

export class productRouter extends BaseRoutes<Product> {
  constructor() {
    super({
      controller: productController,
      endpoint: "/products",
      dtoCreateClass: ProductDTO,
      dtoUpdateClass: UpdateProductDTO,
    });
  }
}
