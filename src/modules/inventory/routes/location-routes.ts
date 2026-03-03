import { BaseRoutes } from "../../../system";
import { LocationDocument } from "../models/location.model";
import { LocationController } from "../controllers/location-controller";
import { LocationDTO, UpdateLocationDTO } from "../models/location.dto";

const locationController = new LocationController();

export class LocationRouter extends BaseRoutes<LocationDocument> {
  constructor() {
    super({
      controller: locationController,
      endpoint: "/inventory/locations",
      dtoCreateClass: LocationDTO,
      dtoUpdateClass: UpdateLocationDTO,
    });
  }
}
