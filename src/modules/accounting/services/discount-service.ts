import { BaseService } from "../../../system";
import { discountModel, DiscountDocument } from "../models/discount.model";

export class DiscountService extends BaseService<DiscountDocument> {
  constructor() {
    super({ model: discountModel });
  }
}
