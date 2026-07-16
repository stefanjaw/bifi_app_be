import { BaseRoutes } from "../../../system";
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
}
