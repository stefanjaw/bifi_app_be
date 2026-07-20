import { BaseController } from "../../../../system";
import { ProductLotDocument } from "@mongodb-types";
import { ProductLotService } from "../services/product-lot-service";

const productLotService = new ProductLotService();

/** Express controller for product lot CRUD operations */
export class ProductLotController extends BaseController<ProductLotDocument> {
  constructor() {
    super({ service: productLotService });
  }
}
