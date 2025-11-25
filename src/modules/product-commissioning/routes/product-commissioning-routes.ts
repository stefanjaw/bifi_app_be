import { BaseRoutes, validateBodyMiddleware } from "../../../system";
import { ProductCommissioningDocument } from "../../../types/mongoose.gen";
import { ProductCommissioningController } from "../controllers/product-commissioning-controller";
import {
  ProductCommissioningDTO,
  UpdateProductCommissioningDTO,
} from "../models/product-commissioning.dto";

const productCommissioningController = new ProductCommissioningController();

export class ProductCommissioningRouter extends BaseRoutes<ProductCommissioningDocument> {
  constructor() {
    super({
      controller: productCommissioningController,
      endpoint: "/product-commissioning",
      dtoCreateClass: ProductCommissioningDTO,
      dtoUpdateClass: UpdateProductCommissioningDTO,
    });

    // custom routes
    this.initPutDecommissionRoute();
  }

  initPutDecommissionRoute() {
    // custom routes
    this.router.put(
      this.endpoint + "/decommission",
      this.upload.any(),
      validateBodyMiddleware(UpdateProductCommissioningDTO),
      (this.controller as ProductCommissioningController).updateDecommission
    );
  }
}
