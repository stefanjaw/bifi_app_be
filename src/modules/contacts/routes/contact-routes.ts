import { BaseRoutes } from "../../../system";
import { ContactDocument } from "../../../types/mongoose.gen";
import { ContactController } from "../controllers/contact-controller";
import { ContactDTO, UpdateContactDTO } from "../models/contact.dto";

const contactController = new ContactController();

export class ContactRouter extends BaseRoutes<ContactDocument> {
  constructor() {
    super({
      controller: contactController,
      endpoint: "/contacts",
      dtoCreateClass: ContactDTO,
      dtoUpdateClass: UpdateContactDTO,
    });
  }
}
