import { BaseService } from "../../../system";
import { raceModel } from "../models/race.model";

/** Business logic service for race operations */
export class RaceService extends BaseService<any> {
  constructor() {
    super({ model: raceModel });
  }
}
