import { CustomsHeadingDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { CustomsHeadingService } from "../services/customs-heading.services";

export class CustomsHeadingController extends BaseController<CustomsHeadingDocument> {
  constructor() {
    super({ service: new CustomsHeadingService() });
  }
}
