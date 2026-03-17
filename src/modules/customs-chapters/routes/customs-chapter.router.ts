import { CustomsChapterDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { CustomsChapterController } from "../controllers/customs-chapter.controller";
import { CustomsChapterDTO, UpdateCustomsChapterDTO } from "../models/customs-chapter.dto";

export class CustomsChapterRouter extends BaseRoutes<CustomsChapterDocument> {
  constructor() {
    super({
      controller: new CustomsChapterController(),
      endpoint: "/customs-chapters",
      dtoCreateClass: CustomsChapterDTO,
      dtoUpdateClass: UpdateCustomsChapterDTO,
    });
  }
}
