import { BaseRoutes } from "../../../system";
import { DiscountDocument } from "../models/discount.model";
import { DiscountController } from "../controllers/discount-controller";
import { DiscountDTO, UpdateDiscountDTO } from "../models/discount.dto";

const discountController = new DiscountController();

export class DiscountRouter extends BaseRoutes<DiscountDocument> {
  constructor() {
    super({
      controller: discountController,
      endpoint: "/accounting/discounts",
      dtoCreateClass: DiscountDTO,
      dtoUpdateClass: UpdateDiscountDTO,
    });
  }
}
