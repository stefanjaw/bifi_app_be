import { BaseService } from "../../../system";
import { ContactDocument } from "../../../types/mongoose.gen";
import { contactModel } from "../models/contact.model";

export class ContactService extends BaseService<ContactDocument> {
  constructor() {
    super({ model: contactModel });
  }
}
