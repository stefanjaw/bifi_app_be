import { BaseService } from "../../../system";
import { productFrequencyModel } from "../models/product-frequency.model";
import { ProductFrequencyDocument } from "@mongodb-types";

/** Business logic service for product frequency operations */
export class ProductFrequencyService extends BaseService<ProductFrequencyDocument> {
  constructor() {
    super({ model: productFrequencyModel });
  }
}
