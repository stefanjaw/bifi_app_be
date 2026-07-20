import { BaseRoutes } from "../../../../system";
import { ProductRouteDocument } from "@mongodb-types";
import { ProductRouteController } from "../controllers/product-route-controller";
import {
  ProductRouteDTO,
  UpdateProductRouteDTO,
} from "../models/product-route.dto";

const productRouteController = new ProductRouteController();

/** Route definitions for product route endpoints */
export class ProductRouteRouter extends BaseRoutes<ProductRouteDocument> {
  constructor() {
    super({
      controller: productRouteController,
      endpoint: "/product-routes",
      dtoCreateClass: ProductRouteDTO,
      dtoUpdateClass: UpdateProductRouteDTO,
    });
  }
}
