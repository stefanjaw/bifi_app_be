import { BaseController } from "../../../system";
import { DiscountDocument } from "../models/discount.model";
import { DiscountService } from "../services/discount-service";

const discountService = new DiscountService();

export class DiscountController extends BaseController<DiscountDocument> {
  constructor() {
    super({ service: discountService });
  }
}
