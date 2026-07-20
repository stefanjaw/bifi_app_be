import { BaseService } from "../../../../system";
import { maritalStatusModel } from "../models/marital-status.model";
import { MaritalStatusDocument } from "../models/marital-status.model";

/** Business logic service for marital status operations */
export class MaritalStatusService extends BaseService<MaritalStatusDocument> {
  constructor() {
    super({ model: maritalStatusModel });
  }
}
