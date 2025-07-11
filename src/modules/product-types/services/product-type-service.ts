import { BaseService } from "../../../system";
import { ProductTypeDocument } from "../../../types/mongoose.gen";
import { productTypeModel } from "../models/product-type.model";

export class ProductTypeService extends BaseService<ProductTypeDocument> {
  constructor() {
    super({ model: productTypeModel });
  }
}
