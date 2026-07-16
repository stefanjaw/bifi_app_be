import { BaseController } from "../../../system";
import { CareContinuumDocument } from "@mongodb-types";
import { CareContinuumService } from "../services/care-continuum-service";
const careContinuumService = new CareContinuumService();
/** Express controller for care continuum CRUD operations */
export class CareContinuumController extends BaseController<CareContinuumDocument> {
  constructor() {
    super({ service: careContinuumService });
  }
}
