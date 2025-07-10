import { BaseService } from "../../../system";
import { productType, productTypeModel } from "../models/product-type.model";

export class ProductTypeService extends BaseService<productType> {
  constructor() {
    super({ model: productTypeModel });
  }
}
