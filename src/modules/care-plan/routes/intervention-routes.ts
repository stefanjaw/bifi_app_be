import { BaseRoutes } from "../../../system";
import { InterventionDocument } from "../models/intervention.model";
import { InterventionController } from "../controllers/intervention-controller";
import {
  InterventionDTO,
  UpdateInterventionDTO,
} from "../models/intervention.dto";

const interventionController = new InterventionController();

/** Route definitions for intervention endpoints */
export class InterventionRouter extends BaseRoutes<InterventionDocument> {
  constructor() {
    super({
      controller: interventionController,
      endpoint: "/interventions",
      dtoCreateClass: InterventionDTO,
      dtoUpdateClass: UpdateInterventionDTO,
    });
  }
}
