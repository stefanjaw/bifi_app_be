import { BaseRoutes } from "../../../system";
import { ProductLotDocument } from "@mongodb-types";
import { ProductLotController } from "../controllers/product-lot-controller";
import { ProductLotDTO, UpdateProductLotDTO } from "../models/product-lot.dto";

const productLotController = new ProductLotController();

/** Route definitions for product lot endpoints */
export class ProductLotRouter extends BaseRoutes<ProductLotDocument> {
  constructor() {
    super({
      controller: productLotController,
      endpoint: "/product-lots",
      dtoCreateClass: ProductLotDTO,
      dtoUpdateClass: UpdateProductLotDTO,
    });
  }
}
