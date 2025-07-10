import { BaseService } from "../../../system";
import { contact, contactModel } from "../models/contact.model";

export class ContactService extends BaseService<contact> {
  constructor() {
    super({ model: contactModel });
  }
}
