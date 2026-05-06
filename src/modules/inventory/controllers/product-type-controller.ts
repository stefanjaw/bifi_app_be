import { BaseController } from "../../../system";
import { ProductTypeDocument } from "../models/product-type.model";
import { ProductTypeService } from "../services/product-type-service";

const productTypeService = new ProductTypeService();

export class ProductTypeController extends BaseController<ProductTypeDocument> {
  constructor() {
    super({ service: productTypeService });
  }
}
