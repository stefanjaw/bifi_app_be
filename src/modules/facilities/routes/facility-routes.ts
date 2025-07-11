import { BaseRoutes } from "../../../system";
import { FacilityDocument } from "../../../types/mongoose.gen";
import { FacilityController } from "../controllers/facility-controller";
import { FacilityDTO, UpdateFacilityDTO } from "../models/facility.dto";

const facilityController = new FacilityController();

export class FacilityRouter extends BaseRoutes<FacilityDocument> {
  constructor() {
    super({
      controller: facilityController,
      endpoint: "/facilities",
      dtoCreateClass: FacilityDTO,
      dtoUpdateClass: UpdateFacilityDTO,
    });
  }
}
