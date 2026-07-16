import { BaseController } from "../../../system";
import { FluidTrackDocument } from "@mongodb-types";
import { FluidTrackService } from "../services/fluidtrack-service";

const fluidTrackService = new FluidTrackService();

/** Express controller for fluid track CRUD operations */
export class FluidTrackController extends BaseController<FluidTrackDocument> {
  constructor() {
    super({ service: fluidTrackService });
  }
}
