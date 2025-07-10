import { BaseController } from "../../../system";
import { contact } from "../models/contact.model";
import { ContactService } from "../services/contact-service";

const contactService = new ContactService();

export class ContactController extends BaseController<contact> {
  constructor() {
    super({ service: contactService });
  }
}
