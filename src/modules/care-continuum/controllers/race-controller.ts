import { BaseController } from "../../../system";
import { CareContinuumRaceDocument } from "@mongodb-types";
import { RaceService } from "../services/race-service";

const raceService = new RaceService();
/** Express controller for race CRUD operations */
export class RaceController extends BaseController<CareContinuumRaceDocument> {
  constructor() {
    super({ service: raceService });
  }
}
