import { FluidTrackItemDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { fluidTrackItemModel } from "../models/fluidtrack-item.model";

/** Business logic service for fluid-track-item operations */
export class FluidTrackItemService extends BaseService<FluidTrackItemDocument> {
  constructor() {
    super({
      model: fluidTrackItemModel,
    });
  }
}
