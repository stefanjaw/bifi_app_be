import {
  authorizeMiddleware,
  BaseRoutes,
  validateBodyMiddleware,
} from "../../../system";
import { ContactDocument } from "../../../types/mongoose.gen";
import { ContactController } from "../controllers/contact-controller";
import { ContactDTO, UpdateContactDTO } from "../models/contact.dto";

const contactController = new ContactController();

/** Route definitions for contact endpoints with photo upload support */
export class ContactRouter extends BaseRoutes<ContactDocument> {
  constructor() {
    super({
      controller: contactController,
      endpoint: "/contacts",
      dtoCreateClass: ContactDTO,
      dtoUpdateClass: UpdateContactDTO,
    });
  }

  /**
   * Overrides POST route to include photo file upload fields.
   */
  override initPostRoute() {
    this.router.post(
      this.endpoint,
      this.upload.fields([{ name: "photo", maxCount: 1 }]),
      validateBodyMiddleware(this.dtoCreateClass),
      authorizeMiddleware(this.resource, "create"),
      this.controller.create,
    );
  }

  /**
   * Overrides PUT route to include photo file upload fields.
   */
  override initPutRoute() {
    this.router.put(
      this.endpoint,
      this.upload.fields([{ name: "photo", maxCount: 1 }]),
      validateBodyMiddleware(this.dtoUpdateClass),
      authorizeMiddleware(this.resource, "update"),
      this.controller.update,
    );
  }
}
