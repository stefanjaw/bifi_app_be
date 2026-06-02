import { BaseRoutes } from "../../../system";
import { MailingListController } from "../controllers/mailing-list-controller";
import {
  MailingListDTO,
  UpdateMailingListDTO,
} from "../models/mailing-list.dto";
import { MailingListDocument } from "../models/mailing-list.model";

const mailingListController = new MailingListController();

export class MailingListRouter extends BaseRoutes<MailingListDocument> {
  constructor() {
    super({
      controller: mailingListController,
      endpoint: "/mailing-lists",
      dtoCreateClass: MailingListDTO,
      dtoUpdateClass: UpdateMailingListDTO,
    });
  }
}
