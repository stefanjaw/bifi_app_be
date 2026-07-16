import { BaseRoutes } from "../../../system";
import { CareContinuumController } from "../controllers/care-continuum-controller";
import {
  CareContinuumDTO,
  UpdateCareContinuumDTO,
} from "../models/care-continuum.dto";
const careContinuumController = new CareContinuumController();
/** Route definitions for care continuum endpoints */
export class CareContinuumRouter extends BaseRoutes<any> {
  constructor() {
    super({
      controller: careContinuumController,
      endpoint: "/care-continuums",
      dtoCreateClass: CareContinuumDTO,
      dtoUpdateClass: UpdateCareContinuumDTO,
    });
  }
}
