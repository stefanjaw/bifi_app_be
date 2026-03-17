import { CustomsHeadingDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { CustomsHeadingController } from "../controllers/customs-heading.controller";
import { CustomsHeadingDTO, UpdateCustomsHeadingDTO } from "../models/customs-heading.dto";

export class CustomsHeadingRouter extends BaseRoutes<CustomsHeadingDocument> {
  constructor() {
    super({
      controller: new CustomsHeadingController(),
      endpoint: "/customs-headings",
      dtoCreateClass: CustomsHeadingDTO,
      dtoUpdateClass: UpdateCustomsHeadingDTO,
    });
  }
}
