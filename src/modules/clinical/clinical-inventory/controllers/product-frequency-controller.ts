import { BaseController } from "../../../../system";
import { ProductFrequencyDocument } from "@mongodb-types";
import { ProductFrequencyService } from "../services/product-frequency-service";

const productFrequencyService = new ProductFrequencyService();

/** Express controller for product frequency CRUD operations */
export class ProductFrequencyController extends BaseController<ProductFrequencyDocument> {
  constructor() {
    super({ service: productFrequencyService });
  }
}
