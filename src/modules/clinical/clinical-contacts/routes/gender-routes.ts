import { BaseRoutes } from "../../../../system";
import { GenderController } from "../controllers/gender-controller";
import { GenderDTO, UpdateGenderDTO } from "../models/gender.dto";
import { GenderDocument } from "../models/gender.model";

const genderController = new GenderController();

/** Route definitions for gender endpoints */
export class GenderRouter extends BaseRoutes<GenderDocument> {
  constructor() {
    super({
      controller: genderController,
      endpoint: "/genders",
      dtoCreateClass: GenderDTO,
      dtoUpdateClass: UpdateGenderDTO,
    });
  }
}
