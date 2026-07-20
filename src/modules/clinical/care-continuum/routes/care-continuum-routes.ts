import { BaseRoutes } from "../../../../system";
import { CareContinuumController } from "../controllers/care-continuum-controller";
import {
  CareContinuumDTO,
  UpdateCareContinuumDTO,
} from "../models/care-continuum.dto";
import { CareContinuumDocument } from "../models/care-continuum.model";
const careContinuumController = new CareContinuumController();
/** Route definitions for care continuum endpoints */
export class CareContinuumRouter extends BaseRoutes<CareContinuumDocument> {
  constructor() {
    super({
      controller: careContinuumController,
      endpoint: "/care-continuums",
      dtoCreateClass: CareContinuumDTO,
      dtoUpdateClass: UpdateCareContinuumDTO,
    });
  }
}
