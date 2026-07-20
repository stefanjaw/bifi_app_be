import { BaseController } from "../../../../system";
import { ContactLabelDocument } from "@mongodb-types";
import { ContactLabelService } from "../services/contact-label-service";

const contactLabelService = new ContactLabelService();

/** Express controller for contact label CRUD operations */
export class ContactLabelController extends BaseController<ContactLabelDocument> {
  constructor() {
    super({ service: contactLabelService });
  }
}
