import { ContactDocument, RoleDocument, UserDocument } from "@mongodb-types";
import { BaseService, runTransaction } from "../../../system";
import { userModel } from "../models/user.model";
import mongoose from "mongoose";
import { PaginateModel } from "mongoose";
import { UserDTO } from "../models/user.dto";
import { ContactService } from "../../contacts/services/contact-service";

export class UserService extends BaseService<UserDocument> {
  private contactService = new ContactService();

  constructor() {
    super({
      model: userModel,
      refFields: [
        {
          path: "roles",
          getModel: () => mongoose.model("Role") as PaginateModel<RoleDocument>,
          isArray: true,
        },
        {
          path: "contactId",
          getModel: () =>
            mongoose.model("Contact") as PaginateModel<ContactDocument>,
          isArray: false,
        },
      ],
    });
  }

  /**
   * Creates a new user. If contact information is provided without an _id, a new contact will be created.
   * If contact information with an _id is provided, the existing contact will be updated.
   * And the contactId field of the user will be set to the created/updated contact's _id.
   *
   * @param data The user data to create. If contact information is provided without an _id, a new contact will be created.
   * @param session
   * @returns The created user document.
   */
  override async create(
    data: UserDTO,
    session?: mongoose.ClientSession | undefined
  ): Promise<UserDocument> {
    return await runTransaction<UserDocument>(session, async (newSession) => {
      let contactId: string | undefined = data.contactId;

      // If contact information is provided without an _id, create a new contact
      if (data.contactInformation && !data.contactInformation._id) {
        const newContact = await this.contactService.create(
          data.contactInformation,
          newSession
        );

        contactId = newContact._id.toString();
      } else if (data.contactInformation && data.contactInformation._id) {
        // If contact information with an _id is provided, update the existing contact
        const updatedContact = await this.contactService.update(
          {
            ...data.contactInformation,
            type: "individual",
            _id: data.contactInformation._id,
          },
          newSession
        );
        contactId = updatedContact._id.toString();
      }

      const userData: UserDTO = {
        ...data,
        contactId: contactId,
      };

      return super.create(userData, newSession);
    });
  }
}
