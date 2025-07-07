import { BaseService } from "../../../utils";
import { product, productModel } from "../models/product";

export class ProductService extends BaseService<product> {
  constructor() {
    super(productModel);
  }
}
