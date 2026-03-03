import { BaseService } from "../../../system";
import { locationModel, LocationDocument } from "../models/location.model";

export class LocationService extends BaseService<LocationDocument> {
  constructor() {
    super({ model: locationModel });
  }
}
