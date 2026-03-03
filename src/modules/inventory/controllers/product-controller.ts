import { BaseController } from "../../../system";
import { ProductDocument } from "../models/product.model";
import { ProductService } from "../services/product-service";

const productService = new ProductService();

export class ProductController extends BaseController<ProductDocument> {
  constructor() {
    super({ service: productService });
  }
}
