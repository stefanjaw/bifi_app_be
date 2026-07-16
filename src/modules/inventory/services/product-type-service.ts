import { BaseService } from "../../../system";
import {
  productTypeModel,
  ProductTypeDocument,
} from "../models/product-type.model";

/** Business logic service for product type operations */
export class ProductTypeService extends BaseService<ProductTypeDocument> {
  constructor() {
    super({ model: productTypeModel });
  }
}
