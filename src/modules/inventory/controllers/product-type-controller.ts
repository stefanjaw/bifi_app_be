import { BaseController } from "../../../system";
import { ProductTypeDocument } from "../models/product-type.model";
import { ProductTypeService } from "../services/product-type-service";

const productTypeService = new ProductTypeService();

/** Express controller for product type CRUD operations */
export class ProductTypeController extends BaseController<ProductTypeDocument> {
  constructor() {
    super({ service: productTypeService });
  }
}
