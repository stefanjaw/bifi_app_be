import { BaseController } from "../../../system";
import { FluidTrackItemDocument } from "@mongodb-types";
import { FluidTrackItemService } from "../services/fluidtrack-item-service";

const fluidTrackItemService = new FluidTrackItemService();

/** Express controller for fluid-track-item CRUD operations */
export class FluidTrackItemController extends BaseController<FluidTrackItemDocument> {
  constructor() {
    super({ service: fluidTrackItemService });
  }
}
