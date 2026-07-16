import { BaseService } from "../../../system";
import { locationModel, LocationDocument } from "../models/location.model";

/** Business logic service for location operations */
export class LocationService extends BaseService<LocationDocument> {
  constructor() {
    super({ model: locationModel });
  }
}
