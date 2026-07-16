import { BaseRoutes } from "../../../system";
import { ContactLabelController } from "../controllers/contact-label-controller";
import {
  ContactLabelDTO,
  UpdateContactLabelDTO,
} from "../models/contact-label.dto";

const contactLabelController = new ContactLabelController();

/** Route definitions for contact label endpoints */
export class ContactLabelRouter extends BaseRoutes<any> {
  constructor() {
    super({
      controller: contactLabelController,
      endpoint: "/contact-labels",
      dtoCreateClass: ContactLabelDTO,
      dtoUpdateClass: UpdateContactLabelDTO,
    });
  }
}
