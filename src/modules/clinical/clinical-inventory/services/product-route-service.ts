import { BaseService } from "../../../../system";
import { productRouteModel } from "../models/product-route.model";
import { ProductRouteDocument } from "@mongodb-types";

/** Business logic service for product route operations */
export class ProductRouteService extends BaseService<ProductRouteDocument> {
  constructor() {
    super({ model: productRouteModel });
  }
}
