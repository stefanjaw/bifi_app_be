import { BaseController } from "../../../system";
import { ContactDocument } from "../../../types/mongoose.gen";
import { ContactService } from "../services/contact-service";

const contactService = new ContactService();

export class ContactController extends BaseController<ContactDocument> {
  constructor() {
    super({ service: contactService });
  }
}
