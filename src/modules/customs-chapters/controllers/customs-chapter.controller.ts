import { CustomsChapterDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { CustomsChapterService } from "../services/customs-chapter.services";

export class CustomsChapterController extends BaseController<CustomsChapterDocument> {
  constructor() {
    super({ service: new CustomsChapterService() });
  }
}
