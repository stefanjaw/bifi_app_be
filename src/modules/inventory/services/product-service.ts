import { BaseService } from "../../../system";
import { productModel, ProductDocument } from "../models/product.model";

export class ProductService extends BaseService<ProductDocument> {
  constructor() {
    super({ model: productModel });
  }
}
