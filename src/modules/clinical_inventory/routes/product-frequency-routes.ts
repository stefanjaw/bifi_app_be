import { BaseRoutes } from "../../../system";
import { ProductFrequencyDocument } from "@mongodb-types";
import { ProductFrequencyController } from "../controllers/product-frequency-controller";
import {
  ProductFrequencyDTO,
  UpdateProductFrequencyDTO,
} from "../models/product-frequency.dto";

const productFrequencyController = new ProductFrequencyController();

/** Route definitions for product frequency endpoints */
export class ProductFrequencyRouter extends BaseRoutes<ProductFrequencyDocument> {
  constructor() {
    super({
      controller: productFrequencyController,
      endpoint: "/product-frequencies",
      dtoCreateClass: ProductFrequencyDTO,
      dtoUpdateClass: UpdateProductFrequencyDTO,
    });
  }
}
