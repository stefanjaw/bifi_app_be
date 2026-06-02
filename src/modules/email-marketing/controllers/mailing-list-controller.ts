import { BaseController } from "../../../system";
import { MailingListDocument } from "../models/mailing-list.model";
import { MailingListService } from "../services/mailing-list-service";

const mailingListService = new MailingListService();

export class MailingListController extends BaseController<MailingListDocument> {
  constructor() {
    super({ service: mailingListService });
  }
}
