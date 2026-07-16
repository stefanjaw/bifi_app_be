import { BaseService } from "../../../system";
import { contactLabelModel } from "../models/contact-label.model";

/** Business logic service for contact label operations */
export class ContactLabelService extends BaseService<any> {
  constructor() {
    super({ model: contactLabelModel });
  }
}
