import { BaseController } from "../../../../system";
import { ProductRouteDocument } from "@mongodb-types";
import { ProductRouteService } from "../services/product-route-service";

const productRouteService = new ProductRouteService();

/** Express controller for product route CRUD operations */
export class ProductRouteController extends BaseController<ProductRouteDocument> {
  constructor() {
    super({ service: productRouteService });
  }
}
