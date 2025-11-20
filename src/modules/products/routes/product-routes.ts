import {
  authorizeMiddleware,
  BaseRoutes,
  validateBodyMiddleware,
} from "../../../system";
import { ProductDocument } from "../../../types/mongoose.gen";
import { ProductController } from "../controllers/product-controller";
import { ProductCSVDTO } from "../models/product-csv.dto";
import {
  ProductDTO,
  SkipProductPMDTO,
  UpdateProductDTO,
} from "../models/product.dto";

const productController = new ProductController();

export class ProductRouter extends BaseRoutes<ProductDocument> {
  constructor() {
    super({
      controller: productController,
      endpoint: "/products",
      dtoCreateClass: ProductDTO,
      dtoUpdateClass: UpdateProductDTO,
      csvDtoClass: ProductCSVDTO,
    });
  }

  protected override initRoutes(): void {
    this.initSkipProductPMRoute();
    super.initRoutes();
  }

  override initPutRoute() {
    this.router.put(
      this.endpoint,
      this.upload.fields([
        { name: "photo", maxCount: 1 },
        { name: "attachments", maxCount: 10 },
      ]),
      validateBodyMiddleware(this.dtoUpdateClass),
      authorizeMiddleware(this.resource, "update"),
      this.controller.update
    );
  }

  initSkipProductPMRoute() {
    this.router.put(
      `${this.endpoint}/skip-pm`,
      this.upload.any(),
      validateBodyMiddleware(SkipProductPMDTO),
      authorizeMiddleware(`${this.resource}/skip-pm`, "update"),
      productController.updateSkipProductPM
    );
  }
}
