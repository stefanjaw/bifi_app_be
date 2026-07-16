import { BaseController } from "../../../system";
import { GenderDocument } from "@mongodb-types";
import { GenderService } from "../services/gender-service";

const genderService = new GenderService();

/** Express controller for gender CRUD operations */
export class GenderController extends BaseController<GenderDocument> {
  constructor() {
    super({ service: genderService });
  }
}
