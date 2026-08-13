import {
  authorizeMiddleware,
  BaseRoutes,
  validateBodyMiddleware,
} from "../../../system";
import { ProductDocument } from "../models/product.model";
import { ProductController } from "../controllers/product-controller";
import { ProductDTO, UpdateProductDTO } from "../models/product.dto";

const productController = new ProductController();

/** Route definitions for product endpoints with file upload support */
export class ProductRouter extends BaseRoutes<ProductDocument> {
  constructor() {
    super({
      controller: productController,
      endpoint: "/inventory/products",
      dtoCreateClass: ProductDTO,
      dtoUpdateClass: UpdateProductDTO,
    });
  }

  override initPostRoute() {
    this.router.post(
      this.endpoint,
      this.upload.fields([
        { name: "photo", maxCount: 1 },
        { name: "attachments", maxCount: 10 },
      ]),
      validateBodyMiddleware(this.dtoCreateClass),
      authorizeMiddleware(this.resource, "create"),
      this.controller.create,
    );
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
      this.controller.update,
    );
  }

  /**
   * Registers the standard CRUD routes (via super) plus a custom
   * GET /inventory/products/:id/stock-summary endpoint that returns the
   * aggregated stock summary for a product. Permission-gated with the same
   * `inventory/products:read` policy as the standard getById route.
   */
  protected override initRoutes(): void {
    super.initRoutes();
    this.router.get(
      `${this.endpoint}/:id/stock-summary`,
      authorizeMiddleware(this.resource, "read"),
      productController.getStockSummary,
    );
  }
}
