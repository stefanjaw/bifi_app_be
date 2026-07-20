import { BaseRoutes } from "../../../../system";
import { RaceController } from "../controllers/race-controller";
import { RaceDTO, UpdateRaceDTO } from "../models/race.dto";
import { CareContinuumRaceDocument } from "../models/race.model";

const raceController = new RaceController();
/** Route definitions for race endpoints */
export class RaceRouter extends BaseRoutes<CareContinuumRaceDocument> {
  constructor() {
    super({
      controller: raceController,
      endpoint: "/races",
      dtoCreateClass: RaceDTO,
      dtoUpdateClass: UpdateRaceDTO,
    });
  }
}
