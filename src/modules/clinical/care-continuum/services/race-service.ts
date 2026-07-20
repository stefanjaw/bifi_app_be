import { BaseService } from "../../../../system";
import { raceModel } from "../models/race.model";
import { CareContinuumRaceDocument } from "../models/race.model";

/** Business logic service for race operations */
export class RaceService extends BaseService<CareContinuumRaceDocument> {
  constructor() {
    super({ model: raceModel });
  }
}
