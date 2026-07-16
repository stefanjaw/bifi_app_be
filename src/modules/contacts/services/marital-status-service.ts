import { BaseService } from "../../../system";
import { maritalStatusModel } from "../models/marital-status.model";

/** Business logic service for marital status operations */
export class MaritalStatusService extends BaseService<any> {
  constructor() {
    super({ model: maritalStatusModel });
  }
}
