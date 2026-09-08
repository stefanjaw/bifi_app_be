import {
  BaseRoutes,
  validateBodyMiddleware,
  authorizeMiddleware,
} from "../../../system";
import { StockMovementDocument } from "../models/stock-movement.model";
import { StockMovementController } from "../controllers/stock-movement-controller";
import {
  StockMovementDTO,
  TransferDTO,
  ReversalDTO,
  UpdateStockMovementDTO,
} from "../models/stock-movement.dto";

const stockMovementController = new StockMovementController();

/**
 * Route definitions for stock movement endpoints.
 * Posted stock movements are immutable: PUT/DELETE routes are intentionally not
 * registered; corrections go through POST /{endpoint}/:id/reversal.
 */
export class StockMovementRouter extends BaseRoutes<StockMovementDocument> {
  constructor() {
    super({
      controller: stockMovementController,
      endpoint: "/inventory/movements",
      dtoCreateClass: StockMovementDTO,
      dtoUpdateClass: UpdateStockMovementDTO,
    });
  }

  protected override initRoutes() {
    super.initRoutes();
    this.router.post(
      "/inventory/transfers",
      this.upload.any(),
      validateBodyMiddleware(TransferDTO),
      authorizeMiddleware("inventory/movements", "create"),
      stockMovementController.transfer,
    );
    this.router.post(
      `${this.endpoint}/:id/reversal`,
      validateBodyMiddleware(ReversalDTO),
      authorizeMiddleware("inventory/movements", "create"),
      stockMovementController.reverse,
    );
  }

  /** Posted movements are immutable — updates are not allowed */
  protected override initPutRoute(): void {}

  /** Posted movements are immutable — deletions are not allowed */
  protected override initDeleteRoute(): void {}
}
