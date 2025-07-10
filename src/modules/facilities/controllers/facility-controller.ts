import { BaseController } from "../../../system";
import { facility } from "../models/facility";
import { FacilityService } from "../services/facility-service";

const facilityService = new FacilityService();

export class FacilityController extends BaseController<facility> {
  constructor() {
    super({ service: facilityService });
  }
}
