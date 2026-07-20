import { BaseRoutes, authorizeMiddleware } from "../../../../system";
import { BedController } from "../controllers/bed-controller";
import { BedDTO, UpdateBedDTO } from "../models/bed.dto";
import { BedDocument } from "../models/bed.model";

const bedController = new BedController();

/** Route definitions for bed endpoints */
export class BedRouter extends BaseRoutes<BedDocument> {
  constructor() {
    super({
      controller: bedController,
      endpoint: "/beds",
      dtoCreateClass: BedDTO,
      dtoUpdateClass: UpdateBedDTO,
    });
  }

  protected override initRoutes() {
    super.initRoutes();

    this.router.put(
      "/beds/:id/reserve",
      authorizeMiddleware("beds", "update"),
      bedController.reserve,
    );

    this.router.put(
      "/beds/:id/cancel-reservation",
      authorizeMiddleware("beds", "update"),
      bedController.cancelReservation,
    );

    this.router.put(
      "/beds/:id/assign",
      authorizeMiddleware("beds", "update"),
      bedController.assign,
    );

    this.router.put(
      "/beds/:id/cancel-assignment",
      authorizeMiddleware("beds", "update"),
      bedController.cancelAssignment,
    );

    this.router.get(
      "/facilities/with-available-beds",
      authorizeMiddleware("beds", "read"),
      bedController.getFacilitiesWithAvailableBeds,
    );
  }
}
