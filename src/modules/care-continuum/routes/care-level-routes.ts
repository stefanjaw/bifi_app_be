import { BaseRoutes } from "../../../system";
import { CareContinuumLevelController } from "../controllers/care-level-controller";
import {
  CareContinuumLevelDTO,
  UpdateCareContinuumLevelDTO,
} from "../models/care-level.dto";

const careContinuumLevelController = new CareContinuumLevelController();
/** Route definitions for care continuum level endpoints */
export class CareContinuumLevelRouter extends BaseRoutes<any> {
  constructor() {
    super({
      controller: careContinuumLevelController,
      endpoint: "/care-continuum-levels",
      dtoCreateClass: CareContinuumLevelDTO,
      dtoUpdateClass: UpdateCareContinuumLevelDTO,
    });
  }
}
