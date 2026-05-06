import { BaseRoutes } from "../../../system";
import { ProductTypeDocument } from "../models/product-type.model";
import { ProductTypeController } from "../controllers/product-type-controller";
import { ProductTypeDTO, UpdateProductTypeDTO } from "../models/product-type.dto";

const productTypeController = new ProductTypeController();

export class ProductTypeRouter extends BaseRoutes<ProductTypeDocument> {
  constructor() {
    super({
      controller: productTypeController,
      endpoint: "/inventory/product-types",
      dtoCreateClass: ProductTypeDTO,
      dtoUpdateClass: UpdateProductTypeDTO,
    });
  }
}
