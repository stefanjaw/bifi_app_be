import { BaseController } from "../../../system";
import { ProductTypeDocument } from "../../../types/mongoose.gen";
import { ProductTypeService } from "../services/product-type-service";

const productTypeService = new ProductTypeService();

export class ProductTypeController extends BaseController<ProductTypeDocument> {
  constructor() {
    super({ service: productTypeService });
  }
}
