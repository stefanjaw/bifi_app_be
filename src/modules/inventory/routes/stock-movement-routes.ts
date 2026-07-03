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
  UpdateStockMovementDTO,
} from "../models/stock-movement.dto";

const stockMovementController = new StockMovementController();

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
  }
}
