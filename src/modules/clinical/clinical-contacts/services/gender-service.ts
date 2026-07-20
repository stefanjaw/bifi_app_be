import { BaseService } from "../../../../system";
import { genderModel } from "../models/gender.model";
import { GenderDocument } from "../models/gender.model";

/** Business logic service for gender operations */
export class GenderService extends BaseService<GenderDocument> {
  constructor() {
    super({ model: genderModel });
  }
}
