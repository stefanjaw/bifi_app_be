import { BaseController } from "../../../system";
import { InterventionDocument } from "../models/intervention.model";
import { InterventionService } from "../services/intervention-service";

const interventionService = new InterventionService();

/** Express controller for intervention CRUD operations */
export class InterventionController extends BaseController<InterventionDocument> {
  constructor() {
    super({ service: interventionService });
  }
}
