import { BaseController } from "../../../system";
import { FacilityDocument } from "../../../types/mongoose.gen";
import { FacilityService } from "../services/facility-service";

const facilityService = new FacilityService();

export class FacilityController extends BaseController<FacilityDocument> {
  constructor() {
    super({ service: facilityService });
  }
}
