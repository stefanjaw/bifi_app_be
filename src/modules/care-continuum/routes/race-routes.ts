import { BaseRoutes } from "../../../system";
import { RaceController } from "../controllers/race-controller";
import { RaceDTO, UpdateRaceDTO } from "../models/race.dto";

const raceController = new RaceController();
/** Route definitions for race endpoints */
export class RaceRouter extends BaseRoutes<any> {
  constructor() {
    super({
      controller: raceController,
      endpoint: "/races",
      dtoCreateClass: RaceDTO,
      dtoUpdateClass: UpdateRaceDTO,
    });
  }
}
