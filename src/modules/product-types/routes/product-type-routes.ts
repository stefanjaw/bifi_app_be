import { BaseRoutes } from "../../../system";
import { ProductTypeDocument } from "../../../types/mongoose.gen";
import { ProductTypeController } from "../controllers/product-type-controller";
import {
  ProductTypeDTO,
  UpdateProductTypeDTO,
} from "../models/product-type.dto";

const productTypeController = new ProductTypeController();

export class ProductTypeRouter extends BaseRoutes<ProductTypeDocument> {
  constructor() {
    super({
      controller: productTypeController,
      endpoint: "/product-types",
      dtoCreateClass: ProductTypeDTO,
      dtoUpdateClass: UpdateProductTypeDTO,
    });
  }
}
