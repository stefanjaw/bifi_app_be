import { BaseService } from "../../../system";
import { careContinuumLevelModel } from "../models/care-level.model";

/** Business logic service for care continuum level operations */
export class CareContinuumLevelService extends BaseService<any> {
  constructor() {
    super({ model: careContinuumLevelModel });
  }
}
