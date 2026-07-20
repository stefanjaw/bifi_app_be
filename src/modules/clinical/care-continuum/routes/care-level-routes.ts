import { BaseRoutes } from "../../../../system";
import { CareContinuumLevelController } from "../controllers/care-level-controller";
import {
  CareContinuumLevelDTO,
  UpdateCareContinuumLevelDTO,
} from "../models/care-level.dto";
import { CareContinuumLevelDocument } from "../models/care-level.model";

const careLevelController = new CareContinuumLevelController();
/** Route definitions for care continuum level endpoints */
export class CareContinuumLevelRouter extends BaseRoutes<CareContinuumLevelDocument> {
  constructor() {
    super({
      controller: careLevelController,
      endpoint: "/care-continuum-levels",
      dtoCreateClass: CareContinuumLevelDTO,
      dtoUpdateClass: UpdateCareContinuumLevelDTO,
    });
  }
}
