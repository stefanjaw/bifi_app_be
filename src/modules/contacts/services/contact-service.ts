import { BaseService } from "../../../utils";
import { contact, contactModel } from "../models/contact";

export class ContactService extends BaseService<contact> {
  constructor() {
    super(contactModel);
  }
}
