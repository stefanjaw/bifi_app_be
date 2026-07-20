import { BaseRoutes } from "../../../../system";
import { FluidTrackItemDocument } from "@mongodb-types";
import { FluidTrackItemController } from "../controllers/fluidtrack-item-controller";
import {
  FluidTrackItemDTO,
  UpdateFluidTrackItemDTO,
} from "../models/fluidtrack-item.dto";

const fluidTrackItemController = new FluidTrackItemController();

/** Route definitions for fluid-track-item endpoints */
export class FluidTrackItemRouter extends BaseRoutes<FluidTrackItemDocument> {
  constructor() {
    super({
      controller: fluidTrackItemController,
      endpoint: "/fluid-track-items",
      dtoCreateClass: FluidTrackItemDTO,
      dtoUpdateClass: UpdateFluidTrackItemDTO,
    });
  }
}
