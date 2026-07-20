import { BaseController } from "../../../../system";
import { CareContinuumLevelDocument } from "@mongodb-types";
import { CareContinuumLevelService } from "../services/care-level-service";

const careContinuumLevelService = new CareContinuumLevelService();
/** Express controller for care continuum level CRUD operations */
export class CareContinuumLevelController extends BaseController<CareContinuumLevelDocument> {
  constructor() {
    super({ service: careContinuumLevelService });
  }
}
