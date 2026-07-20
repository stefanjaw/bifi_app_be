import { CareContinuumRaceDocument } from "@mongodb-types";
import { RaceService } from "../services/race-service";
import { BaseController } from "../../../../system";

const raceService = new RaceService();

/** Express controller for race CRUD operations */
export class RaceController extends BaseController<CareContinuumRaceDocument> {
  constructor() {
    super({ service: raceService });
  }
}
