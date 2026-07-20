import { BaseService } from "../../../../system";
import { contactLabelModel } from "../models/contact-label.model";
import { ContactLabelDocument } from "../models/contact-label.model";

/** Business logic service for contact label operations */
export class ContactLabelService extends BaseService<ContactLabelDocument> {
  constructor() {
    super({ model: contactLabelModel });
  }
}
