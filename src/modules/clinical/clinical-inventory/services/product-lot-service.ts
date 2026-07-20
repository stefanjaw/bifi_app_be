import { BaseService } from "../../../../system";
import { productLotModel } from "../models/product-lot.model";
import { ProductLotDocument } from "@mongodb-types";

/** Business logic service for product lot operations with reference fields */
export class ProductLotService extends BaseService<ProductLotDocument> {
  constructor() {
    super({
      model: productLotModel,
      refFields: [
        {
          path: "products",
          getModel: () => this.connectionManager.getModel("InventoryProduct"),
          isArray: true,
        },
      ],
    });
  }
}
