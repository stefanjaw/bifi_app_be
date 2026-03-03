import { BaseController } from "../../../system";
import { LocationDocument } from "../models/location.model";
import { LocationService } from "../services/location-service";

const locationService = new LocationService();

export class LocationController extends BaseController<LocationDocument> {
  constructor() {
    super({ service: locationService });
  }
}
