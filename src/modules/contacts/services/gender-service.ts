import { BaseService } from "../../../system";
import { genderModel } from "../models/gender.model";

/** Business logic service for gender operations */
export class GenderService extends BaseService<any> {
  constructor() {
    super({ model: genderModel });
  }
}
