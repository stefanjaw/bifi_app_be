import { BaseRoutes, validateBodyMiddleware } from "../../../system";
import { ProductComissioningDocument } from "../../../types/mongoose.gen";
import { ProductComissioningController } from "../controllers/product-comissioning-controller";
import {
  ProductComissioningDTO,
  UpdateProductComissioningDTO,
} from "../models/product-comissioning.dto";

const productComissioningController = new ProductComissioningController();

export class ProductComissioningRouter extends BaseRoutes<ProductComissioningDocument> {
  constructor() {
    super({
      controller: productComissioningController,
      endpoint: "/product-comissioning",
      dtoCreateClass: ProductComissioningDTO,
      dtoUpdateClass: UpdateProductComissioningDTO,
    });

    // custom routes
    this.initPutDecomissionRoute();
  }

  initPutDecomissionRoute() {
    // custom routes
    this.router.put(
      this.endpoint + "/decomission",
      this.upload.any(),
      validateBodyMiddleware(UpdateProductComissioningDTO),
      (this.controller as ProductComissioningController).updateDecomission
    );
  }
}
