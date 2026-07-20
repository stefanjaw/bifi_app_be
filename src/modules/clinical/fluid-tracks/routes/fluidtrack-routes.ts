import { BaseRoutes, authorizeMiddleware } from "../../../../system";
import { FluidTrackDocument } from "@mongodb-types";
import { FluidTrackController } from "../controllers/fluidtrack-controller";
import { FluidTrackDTO, UpdateFluidTrackDTO } from "../models/fluidtrack.dto";

const fluidTrackController = new FluidTrackController();

/** Route definitions for fluid track endpoints */
export class FluidTrackRouter extends BaseRoutes<FluidTrackDocument> {
  constructor() {
    super({
      controller: fluidTrackController,
      endpoint: "/fluid-tracks",
      dtoCreateClass: FluidTrackDTO,
      dtoUpdateClass: UpdateFluidTrackDTO,
    });
  }

  protected override initRoutes() {
    super.initRoutes();

    this.router.post(
      "/fluid-tracks/:id/add-item",
      authorizeMiddleware("fluid-tracks", "update"),
      fluidTrackController.addItem,
    );

    this.router.get(
      "/fluid-tracks/from-date-days",
      authorizeMiddleware("fluid-tracks", "read"),
      fluidTrackController.getFromDateDays,
    );
  }
}
