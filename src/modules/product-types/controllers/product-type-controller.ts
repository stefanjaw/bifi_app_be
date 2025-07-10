import { BaseController } from "../../../system";
import { productType } from "../models/product-type.model";
import { ProductTypeService } from "../services/product-type-service";

const productTypeService = new ProductTypeService();

export class ProductTypeController extends BaseController<productType> {
  constructor() {
    super({ service: productTypeService });
  }
}
